import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { Application, NextFunction, RequestHandler, Router } from 'express';

interface Headers {
    [header: string]: string;
}

interface RestEndpoint {
    status?: number;
    headers?: Headers;
    content?: string | object;
    file?: string;
    handler?: string;
}

interface RestRoute {
    delete?: RestEndpoint;
    get?: RestEndpoint;
    post?: RestEndpoint;
    put?: RestEndpoint;
}

interface RestData {
    [route: string]: RestRoute;
}

export class RestYAML {
    data?: RestData;
    router?: any;

    constructor(data?: RestData) {
        this.data = data;
    }

    public readDataFile(file: string) {
        this.data = YAML.parse(fs.readFileSync(file, 'utf-8'));
    }

    public watchDataFile(file: string) {
        this.readDataFile(file);
        this.makeRouter();

        fs.watchFile(file, async () => {
            this.log(`Reloading routes from '${file}'...`);

            this.readDataFile(file);
            await this.makeRouter();

            this.log('Successful reloaded the routes.');
        });
    }

    public showEndpoints() {
        for (const route in this.data) {
            const restRoute = this.data[route];

            if (restRoute.delete) {
                console.log(`DELETE ${route}`);
            }

            if (restRoute.get) {
                console.log(`GET ${route}`);
            }

            if (restRoute.post) {
                console.log(`POST ${route}`);
            }

            if (restRoute.put) {
                console.log(`PUT ${route}`);
            }
        }
    }

    public updateData(data: RestData) {
        this.data = data;
    }

    public bind(app: Application) {
        app.use(this.handler.bind(this));
    }

    protected handler(req: any, res: any, next: NextFunction) {
        if (!this.router) {
            next();
        }

        this.router(req, res, next);

        this.log(`Request ${req.method} ${req.url} | Response ${res.statusCode}`);
    }

    protected async makeRouter() {
        const router = Router();

        for (const route in this.data) {
            const restRoute = this.data[route];

            if (restRoute.delete) {
                router.delete(route, await this.getEndpointHandler(restRoute.delete));
            }

            if (restRoute.get) {
                router.get(route, await this.getEndpointHandler(restRoute.get));
            }

            if (restRoute.post) {
                router.post(route, await this.getEndpointHandler(restRoute.post));
            }

            if (restRoute.put) {
                router.put(route, await this.getEndpointHandler(restRoute.put));
            }
        }

        this.router = router;
    }

    protected async getEndpointHandler(endpoint: RestEndpoint): Promise<RequestHandler> {
        const status = endpoint.status ?? 200;
        const headers: Headers = {
            'Content-Type': 'application/json',
        };

        if (endpoint.headers) {
            Object.assign(headers, endpoint.headers);
        }

        if (endpoint.content) {
            return (req, res) => res.header(headers).status(status).send(endpoint.content);
        }

        if (endpoint.file) {
            return (req, res) => {
                let fileContent;

                try {
                    fileContent = fs.readFileSync(endpoint.file, 'utf-8');
                } catch (e) {
                    console.error(e);
                    this.errorHandler(res, 500, 'File not found.');
                    return;
                }

                res
                    .header(headers)
                    .status(status)
                    .send(fileContent);
            }
        }

        if (endpoint.handler) {
            try {
                return await import(path.join(process.cwd(), endpoint.handler));
            } catch (e) {
                console.error(e);
                return (req, res) => this.errorHandler(res, 500, 'Handler not found.');
            }
        }
    }

    protected errorHandler(res: any, status: number, message?: string, headers?: Headers) {
        res
            .status(status)
            .header(headers)
            .send({
                error: true,
                message: message ?? 'Internal error.',
            });
    }

    public log(message: string) {
        console.log(`[REST] ${new Date().toISOString()} - ${message}`);
    }
}
