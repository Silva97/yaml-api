import * as fs from 'fs';
import * as path from 'path';
import * as YAML from 'yaml';
import { Application, NextFunction, RequestHandler, Router } from 'express';
import { DateFormat } from './date-format';
import { ansi, purify } from '@silva97/ansi';

interface Headers {
    [header: string]: string;
}

interface RestEndpoint {
    status?: number;
    headers?: Headers;
    vars: string[];
    content?: string | object;
    file?: string;
    handler?: string;
}

interface RestRoute {
    copy?: RestEndpoint;
    delete?: RestEndpoint;
    get?: RestEndpoint;
    head?: RestEndpoint;
    lock?: RestEndpoint;
    merge?: RestEndpoint;
    options?: RestEndpoint;
    patch?: RestEndpoint;
    post?: RestEndpoint;
    put?: RestEndpoint;
    trace?: RestEndpoint;
}

interface RestData {
    [route: string]: RestRoute;
}

interface RestOptions {
    logFolder: string;
    debug: boolean;
}

export class RestYAML {
    data?: RestData;
    router?: Router;
    options: RestOptions;
    defaultOptions: RestOptions;

    constructor(data?: RestData, options?: RestOptions) {
        this.data = data;

        this.defaultOptions = {
            logFolder: './logs',
            debug: false,
        };

        if (options) {
            this.setOptions(options);
        }
    }

    public setOptions(options: RestOptions) {
        this.options = {
            logFolder: options?.logFolder ?? this.defaultOptions.logFolder,
            debug: options?.debug ?? this.defaultOptions.debug,
        };
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
        const show = (method: string, route: string, endpoint: RestEndpoint) => {
            if (!endpoint) {
                return;
            }

            console.log(ansi`%{bold}${method}%{normal} ${route}`);
        }

        for (const route in this.data) {
            const restRoute = this.data[route];

            show('COPY', route, restRoute.copy);
            show('DELETE', route, restRoute.delete);
            show('GET', route, restRoute.get);
            show('HEAD', route, restRoute.head);
            show('LOCK', route, restRoute.lock);
            show('MERGE', route, restRoute.merge);
            show('OPTIONS', route, restRoute.options);
            show('PATCH', route, restRoute.patch);
            show('POST', route, restRoute.post);
            show('PUT', route, restRoute.put);
            show('TRACE', route, restRoute.trace);
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

        this.log(`Request from ${req.ip} -> ${req.method} ${req.url} | Response ${res.statusCode}`);
    }

    protected async makeRouter() {
        const router = Router();
        this.options = Object.assign({}, this.defaultOptions);

        for (const route in this.data) {
            if (route == 'options') {
                this.setOptions(this.data[route] as RestOptions);
                continue;
            }

            const restRoute = this.data[route];

            await this.bindEndpoint(router, 'COPY', route, restRoute.copy);
            await this.bindEndpoint(router, 'DELETE', route, restRoute.delete);
            await this.bindEndpoint(router, 'GET', route, restRoute.get);
            await this.bindEndpoint(router, 'HEAD', route, restRoute.head);
            await this.bindEndpoint(router, 'LOCK', route, restRoute.lock);
            await this.bindEndpoint(router, 'MERGE', route, restRoute.merge);
            await this.bindEndpoint(router, 'OPTIONS', route, restRoute.options);
            await this.bindEndpoint(router, 'PATCH', route, restRoute.patch);
            await this.bindEndpoint(router, 'POST', route, restRoute.post);
            await this.bindEndpoint(router, 'PUT', route, restRoute.put);
            await this.bindEndpoint(router, 'TRACE', route, restRoute.trace);
        }

        this.router = router;
    }

    protected async bindEndpoint(router: Router, method: string, route: string, endpoint?: RestEndpoint) {
        if (!endpoint) {
            return;
        }

        const [finalRoute, vars] = this.transformRoute(route);
        endpoint.vars = vars;

        switch (method) {
            case 'COPY':
                router.copy(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'DELETE':
                router.delete(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'GET':
                router.get(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'HEAD':
                router.head(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'LOCK':
                router.lock(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'MERGE':
                router.merge(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'OPTIONS':
                router.options(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'PATCH':
                router.patch(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'POST':
                router.post(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'PUT':
                router.put(finalRoute, await this.getEndpointHandler(endpoint));
                break;
            case 'TRACE':
                router.trace(finalRoute, await this.getEndpointHandler(endpoint));
                break;
        }
    }

    protected transformRoute(route: string): [string, string[]] {
        const varList = [];

        return [
            route.replace(/\{([a-z_]+)\}/gi, (match: string, variable: string) => {
                varList.push(variable);
                return ':' + variable;
            }),
            varList,
        ];
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
            return (req, res) => res
                .header(headers)
                .status(status)
                .send(this.replaceVars(req, endpoint.content, endpoint));
        }

        if (endpoint.file) {
            return (req, res) => {
                let fileContent;

                try {
                    fileContent = fs.readFileSync(endpoint.file, 'utf-8');
                } catch (e) {
                    this.rawLog(e.stack);
                    this.errorHandler(res, 500, e);
                    return;
                }

                res
                    .header(headers)
                    .status(status)
                    .send(fileContent);
            }
        }

        if (endpoint.handler) {
            return async (req, res) => {
                try {
                    const handler = await import(path.join(process.cwd(), endpoint.handler));
                    handler(req, res);
                } catch (e) {
                    this.rawLog(e.stack);
                    this.errorHandler(res, 500, e);
                }
            }
        }

        return (req, res) => res.header(headers).status(status).send();
    }

    protected replaceVars(req: any, content: string | object, endpoint: RestEndpoint) {
        if (typeof content == 'object') {
            content = JSON.stringify(content);
        }

        const varNames = endpoint.vars.join('|');

        const regex = new RegExp('\\$\\{(' + varNames + ')\\}', 'g');
        content = content.replace(regex, (match, name) => req.params[name] ?? '');

        return content;
    }

    protected errorHandler(res: any, status: number, error?: Error, message?: string) {
        message = message ?? 'Internal server error.';

        if (this.options.debug) {
            res
                .status(status)
                .send({
                    message,
                    error: error?.stack.split('\n') ?? null,
                });
            return;
        }

        res
            .status(status)
            .send({
                message,
            });
    }

    public log(message: string) {
        const date = new DateFormat();

        this.rawLog(ansi`[%{bold;f.blue}API%{normal}] ${date.getFullTime()} - %{bold}${message}`);
    }

    public rawLog(text: string) {
        const date = new DateFormat();
        const filename = date.getFullDate() + '.log';

        console.log(text);

        fs.mkdirSync(this.options.logFolder, {
            recursive: true,
        });
        fs.appendFileSync(path.join(this.options.logFolder, filename), purify(text) + '\n', 'utf-8');
    }
}
