var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');

/**
 * error - description
 *
 * @param  {Error}            err        the error that should be processed to client side
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIExpress
 */
function error(err, req, res, next) {
  if (err instanceof ModelAPIError) {
    toSend = extend({error: true}, err);
    res.status(err.code);
    res.json(toSend);
  } else {
    toSend = {
      error: true,
      message: err.message,
      stack: err.stack
    };
    res.status(500);
    res.json(toSend);
  }
};

module.exports = exports = error;
