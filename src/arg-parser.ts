interface Argument {
    names: string[];
    description: string;
    defaultValue?: any;
}

interface ArgumentValue {
    [name: string]: any;
}

const ARG_INVALID_STATUS = 2;


export class ArgParser {

    protected positional: Argument[] = [];
    protected optional: Argument[] = [];
    protected values: ArgumentValue = {};
    protected binary: string;

    constructor(binary: string = './bin') {
        this.binary = binary;
    }

    public add(names: string | string[], defaultValue?: any, description?: string) {
        if (typeof names == 'string') {
            names = [names];
        }

        const argument: Argument = {
            names,
            defaultValue,
            description: description ?? '',
        };

        if (this.isOptional(names[0])) {
            this.optional.push(argument);
            this.set(this.parseArgName(argument.names), defaultValue || false);
        } else {
            this.positional.push(argument);
            const value = defaultValue
                ? String(defaultValue)
                : '';

            this.set(this.parseArgName(argument.names), value);
        }

        return this;
    }

    public set(name: string, value: any) {
        this.values[name] = value;
    }

    public get(name: string) {
        return this.values[name] ?? undefined;
    }

    public parse(argv: string[]) {
        argv = argv.slice(2);

        let position = 0;
        for (const param of argv) {
            if (this.isOptional(param)) {
                const arg = this.findArgument(param);
                if (!arg) {
                    console.error(`The option '${param}' is invalid.`);
                    process.exit(ARG_INVALID_STATUS);
                }

                this.set(this.parseArgName(arg.names), true);
                continue;
            }

            if (this.positional.length <= position) {
                continue;
            }

            const arg = this.positional[position++];
            this.set(this.parseArgName(arg.names), param);
        }
    }

    public showHelp(prologue?: string, epilogue?: string) {
        const alignment = 16;

        if (prologue) {
            console.log(prologue + '\n');
        }

        console.log('USAGE');
        this.printAligned(this.getCommandLineUsage() + '\n', 2);

        for (const arg of this.optional) {
            this.printAligned(arg.names.join(','), 2, alignment, arg.description);
        }

        console.log('\nPOSITIONAL');
        for (const arg of this.positional) {
            const defaultText = arg.defaultValue
                ? ` (default: '${arg.defaultValue}')`
                : '';

            this.printAligned(arg.names[0], 2, alignment, arg.description + defaultText);
        }

        if (epilogue) {
            console.log('\n' + epilogue);
        }
    }

    public getCommandLineUsage() {
        const names: string[] = [];
        let cmd = this.binary;

        for (const arg of this.optional) {
            names.push(this.getShortestName(arg));
        }

        if (names.length) {
            cmd += ' [' + names.join(',') + ']';
        }

        for (const arg of this.positional) {
            cmd += ' ' + arg.names[0];
        }

        return cmd;
    }

    protected printAligned(text: string, identLevel: number = 2, alignment: number = 1, posText?: string) {
        const message = ''.padStart(identLevel, ' ')
            + text.padEnd(alignment, ' ')
            + (posText ?? '');

        console.log(message);
    }

    protected getShortestName(argument: Argument) {
        let shortest = argument.names[0];

        for (const name of argument.names) {
            if (name.length < shortest.length) {
                shortest = name;
            }
        }

        return shortest;
    }

    protected isOptional(argument: string) {
        return argument.startsWith('-');
    }

    protected findArgument(name: string): Argument | undefined {
        const list = (this.isOptional(name))
            ? this.optional
            : this.positional;

        return list.find((value) => value.names.includes(name));;
    }

    protected parseArgName(names: string[]) {
        const name = names[0].replace(/\-+([a-z])?/gi, (match: string, letter: string) => {
            return letter.toUpperCase();
        });

        return name[0].toLowerCase() + name.slice(1);
    }
}
