export class DateFormat {
    date: Date;

    constructor(time?: string) {
        this.date = time
            ? new Date(time)
            : new Date();
    }

    public getFullDate(separator: string = '-') {
        return [
            this.date.getUTCFullYear().toString().padStart(4, '0'),
            (this.date.getUTCMonth() + 1).toString().padStart(2, '0'),
            this.date.getUTCDate().toString().padStart(2, '0'),
        ].join(separator);
    }

    public getFullTime(separator: string = ':') {
        return [
            this.date.getUTCHours().toString().padStart(2, '0'),
            this.date.getUTCMinutes().toString().padStart(2, '0'),
            this.date.getUTCSeconds().toString().padStart(2, '0'),
        ].join(separator) + ' UTC';
    }
}
