'use strict';

var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');

/**
 * findById - sub-controller that is used to response
 * with one model instance
 *
 * @param  {String}            method  the name of main controller
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @throws ModelAPIError(404, '...')
 *
 * @memberof ModelAPIRouter
 */
function findById(method, req, res, next) {
  res.__apiMethod = method;
  var self = this;
  var id = req.params.id;
  var fields = this.option(method, 'fields');
  var populate = this.option(method, 'populate');
  var filter = this.option(method, 'filter');
  if (filter instanceof Function) filter = filter.call(this, req);
  var query = extend({_id: id}, filter);
  var dbQuery = this.model.findOne(query, fields);

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }

  dbQuery.exec(function (err, obj) {
    if (err) return next(err);
    if (!obj) {
      return next(new ModelAPIError(
        404, `The ${self.nameSingle} was not found by ${id}`
      ));
    }
    if (method === 'details') res.status(200);
    res.json(obj);
  });
};

module.exports = exports = findById;
