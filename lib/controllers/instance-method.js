'use strict';

const ModelAPIError = require('../model-api-error');
const findById = require('./find-by-id');

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
  res.__apiMethod = 'instanceMethod';
  res.__apiInstanceMethod = methodName;
  const self = this;
  const id = req.params.id;
  const methodOptions = this.apiOptions.expose[methodName];
  const wrapper = (methodOptions.exec instanceof Function) ?
    methodOptions.exec :
    null;

  let filter = this.option(methodName, 'filter');
  if (filter instanceof Function) {
    filter = filter.call(this, req);
  }

  const query = Object.assign({}, filter, { _id: id });
  const params = (methodOptions.method !== 'get') ?
    req.body :
    req.query;

  this.model.findById(query, function (err, obj) {
    if (err) return next(err);
    if (!obj) {
      return next(new ModelAPIError(
        404, `The ${self.nameSingle} was not found by ${id}`
      ));
    };
    const mFunc = wrapper || obj[methodName];
    mFunc.call(obj, params, function(err, result) {
      if (err) return next(err);
      res.json(result);
    });
  });

};

module.exports = exports = callInstanceMethod;
