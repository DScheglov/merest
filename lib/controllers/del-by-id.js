var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');

/**
 * delById - controller that deletes a model instance
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIRouter
 */
function delById(req, res, next) {
  var self = this;
  var id = req.params.id;
  var filter = this.option('delete', 'filter');
  if (filter instanceof Function) filter = filter.call(this, req);
  var query = extend({_id: id}, filter);
  this.model.remove(query).exec(function(err, affected) {
    if (err) return next(err);
    if (affected.result.n == 0) {
      return next(new ModelAPIError(
        404, `The ${self.nameSingle} was not found by ${id}`
      ));
    }
    res.status(200);
    return res.json({});
  });
};

module.exports = exports = delById;
