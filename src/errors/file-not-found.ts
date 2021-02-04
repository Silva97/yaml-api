export class FileNotFound extends Error {
    constructor(filename: string) {
        super();

        this.name = 'FileNotFound';
        this.message = `The file '${filename}' has not found or it's not readable.`;
    }
}
