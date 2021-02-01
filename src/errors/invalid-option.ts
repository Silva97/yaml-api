export class InvalidOption extends Error {
    constructor(name: string) {
        super();

        this.name = 'InvalidOption';
        this.message = `The option '${name}' is invalid`;
    }
}
