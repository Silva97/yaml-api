import * as fs from 'fs';
import * as express from 'express';
import { RestYAML } from './rest-yaml';
import { ArgParser } from './arg-parser';

const args = new ArgParser('yaml-api');
args
    .add(['--help', '-h'], false, 'Show this help message')
    .add('filename', '', 'The YAML full or relative file path');

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

const app = express();

const mock = new RestYAML();

mock.watchDataFile(args.get('filename'));
mock.bind(app);

mock.showEndpoints();
app.listen(3000);
