[
    ![npm package](https://img.shields.io/npm/v/yaml-api)
](https://www.npmjs.com/package/yaml-api)
[
    ![Travis CI](https://travis-ci.com/Silva97/yaml-api.svg?branch=master)
](https://travis-ci.com/github/Silva97/yaml-api)

# yaml-api
Using **yaml-api** you can easily make a RESTful API for _mocking_, _testing_ or [PoC] purposes. It's easy as write a [YAML] document like:

```yaml
/route:
  get:
    status: 200
    content:
      message: Hello World!
```
```json
// Response from GET /route
{
  "message": "Hello World!"
}
```

# Installation and Usage
You can install `yaml-api` package and use it as command-line tool.

```bash
npm i yaml-api
# Or using yarn:
yarn add yaml-api
```

Also you can install the package as global to use the command-line tool without a npm/yarn project folder.
```bash
npm i -g yaml-api
# Or using yarn:
yarn global add yaml-api
```

## Command-line tool
`yaml-api [-h,-l] filename address`

The first argument is the YAML file to be parsed. And the second one is a optional `address:port` argument to specify the address and port to bind the API. For example:

```bash
yaml-api my-api.yaml 192.168.0.4:8888
# Or for only specify the port:
yaml-api my-api.yaml :8888
```

For see more help on how to use the command-line tool, run: `yaml-api --help`.

### Environment variables and Auto-Reloading
If the `.yaml` is updated, the `yaml-api` will be auto reload the file and replaces or change the endpoints.

Also you can create a `.env` file on the same folder on you ran the `yaml-api`, that file will be parsed and environment variables will be defined. If the `.env` is updated, the `yaml-api` will reload too.

### Options
On the YAML document you can specify the `options` object to modify some options of the API.

```yaml
options:
  debug: true          # On enabled, errors will be exposed on responses
  envFile: .env        # The .env file to parse and watch
  logDir: ./my-logs    # The directory used to save the logs

/route:
  get:
    ...
```

To use an environment variable on options, just use `${VAR_NAME}` like the value to option. For instance `debug: ${DEBUG_MODE}` will be set the `debug` option to value of `DEBUG_MODE` environment variable.

### Variables and Parameters
Variable's values expands like [template strings] on JavaScript, so you can concatenate it with normal text like: `envFile: ${BASE_DIR}/.env`

On routes you can also have parameters on the path of the endpoint using `{param_name}` in the URL segment that is expected a parameter.
```yaml
/users/{id}:
  get:
    status: 200
    content:
      id: ${id}
      message: The user of id ${id} exists!
```

Like you can see on the example above, it's possible to expands environment variables and parameters using `${}` notation inside the `content` attribute of the endpoint.

## Writing the YAML Document
The YAML document's root consist of an object with optional `options` attribute and the list of routes to be created on the API.
Each route is an object having attributes to each HTTP method that route support, and the object of the HTTP method is an endpoint consisting of the following optional attributes that you can see on the example below.

```yaml
/route:
  get:
    status: 404            # The status code of the response (default 200)
    headers:               # Custom headers
      X-Example: value
    content: Not Found     # The content of any type to set the response body
    file: ./404.json       # File to set the content of response body
    handler: ./handler.js  # Custom JavaScript handler
  put:
    status: 204
```

The valid HTTP methods are: `copy`, `delete`, `get`, `head`, `lock`, `merge`, `options`, `patch`, `post`, `put` and `trace`.

## Custom Handler
Under the hood `yaml-api` uses the [express] framework to create the API server. So you can write a custom express handler function to handle the request. See example below:

```js
module.exports = function handler(request, response, environment) {
  response
    .status(201)
    .send({
      message: 'User created!',
      var_test: environment.VAR_TEST,
    });
}
```

Just export the function as default and set the file like the handler on the endpoint.
```yaml
/users:
  post:
    handler: ./handlers/user-create.js
```

The `yaml-api` pass an extra third argument to function that is the object with the environment variables parsed from the `.env` file.

You can also use `process.env` to read another environment variables that is not defined on the `.env` file.


[PoC]: https://en.wikipedia.org/wiki/Proof_of_concept
[YAML]: https://en.wikipedia.org/wiki/YAML
[template strings]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
[express]: https://www.npmjs.com/package/express
