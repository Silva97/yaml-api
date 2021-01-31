import { ArgParser } from '../src/arg-parser';
import { InvalidOption, UndefinedArgument } from '../src/errors';

let args: ArgParser;

beforeEach(() => {
    args = new ArgParser();
    args
        .add(['--test', '-t'], 'Test option', { defaultValue: false })
        .add(['--another', '-a'], 'Another option', { defaultValue: true })
        .add('first', 'First argument', { required: true })
        .add('second', 'second-default', { defaultValue: 'second-default', required: false });
});

describe('Validate wrong command lines', () => {
    test('Invalid option expects error', () => {
        expect(() => {
            args.parse(['node', './bin', '--invalid', 'test']);
        }).toThrow(InvalidOption);
    });

    test('Undefined positional argument that is required expects error', () => {
        args.parse(['node', './bin', '-t']);

        expect(() => {
            args.validateArguments();
        }).toThrow(UndefinedArgument);
    });
});

describe('Validate valid command lines', () => {
    test('define boolean options expects to invert the default value', () => {
        args.parse(['node', './bin', 'test', '--another', '--test']);

        expect(args.get('another')).toBe(false);
        expect(args.get('test')).toBe(true);
    });

    test('if argument is not defined expects default value', () => {
        args.parse(['node', './bin', 'test']);

        expect(args.get('test')).toBe(false);
        expect(args.get('another')).toBe(true);
        expect(args.get('first')).toBe('test');
        expect(args.get('second')).toBe('second-default');
    });

    test('check value of defined arguments', () => {
        args.parse(['node', './bin', '-t', '-a', 'test', 'abc123']);

        expect(args.get('test')).toBe(true);
        expect(args.get('another')).toBe(false);
        expect(args.get('first')).toBe('test');
        expect(args.get('second')).toBe('abc123');
    });
});
