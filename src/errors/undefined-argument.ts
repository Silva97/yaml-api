export class UndefinedArgument extends Error {
    constructor(argument: string) {
        super();

        this.name = 'UndefinedArgument';
        this.message = `The expected argument '${argument}' is not defined`;
    }
}
