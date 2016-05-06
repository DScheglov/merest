var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');
var findById = require('./find-by-id');

/**
 * callInstanceMethod - calls specific method of model instance
 *
 * @param  {String}           methodName the name of the method should be called
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIRouter
 */
function callInstanceMethod(methodName, req, res, next) {

  var self = this;
  var id = req.params.id;
  var methodOptions = this.apiOptions.expose[methodName] || {};
  var wrapper = methodOptions.exec;
  if (!(wrapper instanceof Function)) wrapper = null;

  var filter = this.option(methodName, 'filter');
  if (filter instanceof Function) filter = filter.call(this, req);
  var query = extend({_id: id}, filter);

  var httpMethod = methodOptions.method || 'post';
  var params = (httpMethod !== 'get') ? req.body : req.query;

  this.model.findById(query, function (err, obj) {
    if (err) return next(err);
    if (!obj) {
      return next(new ModelAPIError(
        404, `The ${self.nameSingle} was not found by ${id}`
      ));
    };
    var mFunc = wrapper || obj[methodName];
    mFunc.call(obj, params, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

};

module.exports = exports = callInstanceMethod;
