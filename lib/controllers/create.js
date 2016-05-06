'use strict';

var findById = require('./find-by-id');
var ModelAPIError = require('../model-api-error');

/**
 * create - the controller that creates a model instance
 * if instance is creared successfully this controller calls findById controller
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @throws ModelAPIError(406, '...')
 * @throws ModelAPIError(422, '...')
 *
 * @memberof ModelAPIRouter
 */
function create(req, res, next) {
  var self = this;
  if (req.body._id) return next(new ModelAPIError(
    406, `This method doesn't allow to update a(n) ${this.nameSingle}`
  ));
  var populate = this.option('create', 'populate');
  var fields = this.option('create', fields);
  var method = this.option('create', 'method') || 'post';
  var data = (method !== 'get') ? req.body : req.query;
  var obj = new (this.model)(data);
  obj.save(function (err) {
    if (err) {
      if (err.name && err.name == "ValidationError") {
        return next(new ModelAPIError(422, err));
      }
      return next(err);
    }
    req.params.id = obj._id;
    res.status(201);
    return findById.call(self, 'create', req, res, next);
  });
};

module.exports = exports = create;
