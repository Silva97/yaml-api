import { InvalidOption, UndefinedArgument } from "./errors";

interface ArgumentOptions {
    defaultValue?: any;
    required?: boolean;
}

interface Argument extends ArgumentOptions {
    names: string[];
    optionName: string;
    description: string;
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

    public add(names: string | string[], description?: string, options?: ArgumentOptions) {
        if (typeof names == 'string') {
            names = [names];
        }

        const argument: Argument = {
            names,
            optionName: this.parseArgName(names),
            defaultValue: options?.defaultValue,
            description: description ?? '',
            required: options?.required ?? false,
        };

        if (this.isOptional(names[0])) {
            this.optional.push(argument);
            this.set(argument.optionName, options?.defaultValue || false);
        } else {
            this.positional.push(argument);
            const value = options?.defaultValue
                ? String(options?.defaultValue)
                : options?.defaultValue;

            this.set(argument.optionName, value);
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
                const arg = this.findOptionalArgument(param);
                if (!arg) {
                    throw new InvalidOption(param);
                }

                this.set(arg.optionName, !arg.defaultValue);
                continue;
            }

            if (this.positional.length <= position) {
                continue;
            }

            const arg = this.positional[position++];
            this.set(arg.optionName, param);
        }
    }

    public validateArguments() {
        // Checking required positional arguments
        for (let position = 0; position < this.positional.length; position++) {
            const argument = this.positional[position];

            if (argument.required && !this.get(argument.optionName)) {
                throw new UndefinedArgument(argument.names[0]);
            }
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

    protected findOptionalArgument(name: string): Argument | undefined {
        return this.optional.find((value) => value.names.includes(name));;
    }

    protected parseArgName(names: string[]) {
        const name = names[0].replace(/\-+([a-z])?/gi, (match: string, letter: string) => {
            return letter.toUpperCase();
        });

        return name[0].toLowerCase() + name.slice(1);
    }
}
