import * as fs from 'fs';
import * as express from 'express';
import { RestYAML } from './rest-yaml';
import { ArgParser } from './arg-parser';

const args = new ArgParser('yaml-api');
args
    .add(['--help', '-h'], false, 'Show this help message')
    .add(['--list', '-l'], false, 'Only list the endpoints of the given YAML file')
    .add('filename', '', 'The YAML full or relative file path')
    .add('address', ':3000', 'The address:port to bind the API');

args.parse(process.argv);

if (args.get('help')) {
    args.showHelp(
        'Developed by Luiz Felipe <felipe.silva337@yahoo.com>\n' +
        'Version 1.0.0 - Distributed under the MIT License.\n'
    );

    process.exit(0);
}

if (!fs.existsSync(args.get('filename'))) {
    console.error(`File '${args.get('filename')}' not found.`);
    process.exit(1);
}

const api = new RestYAML();

if (args.get('list')) {
    api.readDataFile(args.get('filename'));
    api.showEndpoints();
    process.exit(0);
}

api.watchDataFile(args.get('filename'));

const app = express();
api.bind(app);

const [address, port] = args.get('address').split(':');

app.listen(port, address || '0.0.0.0')
    .on('error', () => {
        console.error(`ERROR: Unable to bind address ${address}:${port}`);
        process.exit(1);
    })
    .on('listening', () => {
        api.log(`Started API on address ${address}:${port}`);
    });
