import { DateFormat } from '../src/utils/date-format';

let date;

beforeEach(() => {
    date = new DateFormat('2021-02-01 21:41:27Z');
});

test('check getFullDate() output', () => {
    expect(date.getFullDate()).toBe('2021-02-01');
});

test('check getFullTime() output', () => {
    expect(date.getFullTime()).toBe('21:41:27 UTC');
});

test('create instance without specify the time expects current time', () => {
    const dateFormat = new DateFormat();
    const date = new Date();

    expect(dateFormat.date.getHours()).toBe(date.getHours());
    expect(dateFormat.date.getMinutes()).toBe(date.getMinutes());
});
