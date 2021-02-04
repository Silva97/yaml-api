import { ArgParser } from '../src/arg-parser';
import { InvalidOption, UndefinedArgument } from '../src/errors';

let args: ArgParser;

beforeEach(() => {
    args = new ArgParser('./test');
    args
        .add(['--test', '-t'], 'Test option', { defaultValue: false })
        .add(['--another', '-a'], 'Another option', { defaultValue: true })
        .add('first', 'First argument', { required: true })
        .add('second', null, { defaultValue: 'second-default', required: false });
});

describe('Validate wrong command lines', () => {
    test('Invalid option expects error', () => {
        expect(() => {
            args.parse(['node', './test', '--invalid', 'test']);
        }).toThrowError("The option '--invalid' is invalid");
    });

    test('Undefined positional argument that is required expects error', () => {
        args.parse(['node', './test', '-t']);

        expect(() => {
            args.validateArguments();
        }).toThrowError("The expected argument 'first' is not defined");
    });
});

describe('Validate valid command lines', () => {
    test('define boolean options expects to invert the default value', () => {
        args.parse(['node', './test', 'test', '--another', '--test']);
        args.validateArguments();

        expect(args.get('another')).toBe(false);
        expect(args.get('test')).toBe(true);
    });

    test('if argument is not defined expects default value', () => {
        args.parse(['node', './test', 'test']);
        args.validateArguments();

        expect(args.get('test')).toBe(false);
        expect(args.get('another')).toBe(true);
        expect(args.get('first')).toBe('test');
        expect(args.get('second')).toBe('second-default');
    });

    test('check value of defined arguments', () => {
        args.parse(['node', './test', '-t', '-a', 'test', 'abc123', 'extra']);
        args.validateArguments();

        expect(args.get('test')).toBe(true);
        expect(args.get('another')).toBe(false);
        expect(args.get('first')).toBe('test');
        expect(args.get('second')).toBe('abc123');
    });
});

test('check command line usage', () => {
    const expected = './test [-t,-a] first second';
    expect(args.getCommandLineUsage()).toBe(expected);
});
