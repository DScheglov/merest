

/**
 * options - controller that returns urls
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIRouter
 */
function options(req, res) {
  res.__apiMethod = 'options';
  res.status(200);
  res.json(this.urls());
}

module.exports = exports = options;
