'use strict';

const findById = require('./find-by-id');
const ModelAPIError = require('../model-api-error');
const helpers = require('../helpers');

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
  res.__apiMethod = 'create';
  const self = this;
  const readonly = this.option('create', 'readonly');
  const method = this.option('create', 'method');
  let data = (method !== 'get') ? req.body : req.query;
  if (readonly) {
    try {
      data = helpers.validateReadonly(
        helpers.flat(data),
        readonly
      );
    } catch(e) {
      return next(e)
    }
  }
  const obj = new (this.model)(data);
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
