#!/usr/bin/env node

import * as fs from 'fs';
import * as express from 'express';
import { RestYAML } from './rest-yaml';
import { ArgParser } from './arg-parser';
import { beautifulTry } from './utils/beatiful-try';

export * from './rest-yaml';

beautifulTry.helpMessage = 'See help: yaml-api --help';
const args = new ArgParser('yaml-api');
args
    .add(['--help', '-h'], 'Show this help message')
    .add(['--list', '-l'], 'Only list the endpoints of the given YAML file')
    .add('filename', 'The YAML full or relative file path', { required: true })
    .add('address', 'The address:port to bind the API', { defaultValue: ':3000' });

beautifulTry(() => args.parse(process.argv));

if (args.get('help')) {
    args.showHelp(
        'Developed by Luiz Felipe <felipe.silva337@yahoo.com>\n' +
        'Version 1.0.2 - Distributed under the MIT License.\n'
    );

    process.exit(0);
}

beautifulTry(() => args.validateArguments());

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
