var ModelAPIError = require('../model-api-error');

/**
 * notSupported - default controller that returns 'Not Supported' message
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIExpress
 */
function notSupported(req, res, next) {
 return next(new ModelAPIError(405, 'Not Supported'));
};

module.exports = exports = notSupported;
