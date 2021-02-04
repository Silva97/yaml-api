import { beautifulTry } from '../src/utils/beatiful-try';
import { ansi } from '@silva97/ansi';

ansi.enabled = false;

let mockExit: jest.SpyInstance, mockError: jest.SpyInstance;

beforeEach(() => {
    mockExit = jest.spyOn(process, 'exit').mockImplementation();
    mockError = jest.spyOn(console, 'error').mockImplementation();
})

test('beautifulTry() without help message', () => {
    beautifulTry(() => {
        throw new Error('Hello Error!');
    });

    expect(mockExit).toBeCalledWith(1);
    expect(mockError).toBeCalledWith('Error: Hello Error!');
    expect(mockError).toBeCalledTimes(1);
});

test('beautifulTry() with help message', () => {
    beautifulTry.helpMessage = 'I am help message!';
    beautifulTry(() => {
        throw new Error('Hello Error!');
    });

    expect(mockExit).toBeCalledWith(1);
    expect(mockError).toBeCalledWith('Error: Hello Error!');
    expect(mockError).toBeCalledWith('I am help message!');
    expect(mockError).toBeCalledTimes(2);
});
