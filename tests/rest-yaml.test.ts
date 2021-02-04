import { RestYAML, RestData } from '../src/rest-yaml';
import { ansi } from '@silva97/ansi';
import * as express from 'express';
import * as request from 'supertest';

jest.mock('fs');
import fs from 'fs';

ansi.enabled = false;
let mockLog: jest.SpyInstance;

const data: RestData = {
    '/test': {
        get: {
            content: {
                abc: '123',
                def: 456,
            },
        },
        post: {
            status: 201,
            file: './test.json',
        },
        put: {
            headers: {
                'X-Test': 'Hello',
                'X-Another': 'World',
            },
            status: 204,
        },
    },
    '/test/{id}': {
        delete: {
            status: 202,
            content: {
                message: 'Deleting id ${id}!',
            },
        },
        patch: {
            handler: './tests/handler-test.js',
        },
    },
};

let api: RestYAML;
let app: express.Application;

beforeEach(() => {
    mockLog = jest.spyOn(console, 'log').mockImplementation();

    api = new RestYAML(data, { logFolder: './logs', debug: true });
    api.makeRouter();
    app = express();
    api.bind(app);
});

test('test showEndpoints()', () => {
    api.showEndpoints();

    expect(mockLog).toBeCalledWith('GET /test');
    expect(mockLog).toBeCalledWith('POST /test');
    expect(mockLog).toBeCalledWith('PUT /test');
    expect(mockLog).toBeCalledWith('DELETE /test/{id}');
    expect(mockLog).toBeCalledWith('PATCH /test/{id}');
    expect(mockLog).toBeCalledTimes(5);
});

test('handler with content defined expects to return JSON encoded content', async () => {
    const response = await request(app).get('/test');

    expect(response.status).toBe(200);
    expect(response.body).toEqual(data['/test'].get.content);
});

/**
 * @todo: Make compatible with ts-jest
*/
// test('handler with file defined expects to read the file content', async () => {
//     const mockExists = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
//     const mockReadFile = jest.spyOn(fs, 'readFileSync').mockReturnValue('{ "message": "mocked-file" }');
//     const response = await request(app).post('/test');

//     expect(mockExists).toBeCalledTimes(1);
//     expect(mockReadFile).toBeCalledTimes(1);
//     expect(response.status).toBe(201);
//     expect(response.body).toEqual({ message: 'mocked-file' });

//     mockExists.mockRestore();
//     mockReadFile.mockRestore();
// });

test('handler with file defined that is not exists expects 500 response', async () => {
    const response = await request(app).post('/test');

    expect(response.body).toEqual({ message: 'Internal server error.' });
    expect(response.status).toBe(500);
});

test('handler with headers defined expects to set the headers', async () => {
    const response = await request(app).put('/test');

    expect(response.status).toBe(204);
    expect(response.headers['x-test']).toBe('Hello');
    expect(response.headers['x-another']).toBe('World');
});

test('test parameter expansion on content', async () => {
    const response = await request(app).delete('/test/777');

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ message: 'Deleting id 777!' });
});

test('test custom handler', async () => {
    const response = await request(app).patch('/test/777');

    expect(response.status).toBe(202);
    expect(response.body).toEqual({ message: 'Hello!' });
});
