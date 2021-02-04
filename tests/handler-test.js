module.exports = function handler(req, res, env) {
    res
        .status(202)
        .send({
            message: 'Hello!',
        });
}
