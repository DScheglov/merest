'use strict';

const ModelAPIError = require('../model-api-error');
const flat = require('../helpers').flat;

/**
 * update - controller that updates a model instance
 *
 * @param  {express.Request}  req    Request
 * @param  {express.Response} res    Response
 * @param  {Function}         next   Callback to pass a thrown exception
 *
 * @throws ModelAPIError(404, '...')
 * @throws ModelAPIError(422, '...')
 *
 * @memberof ModelAPIRouter
 */
function update(req, res, next) {
  res.__apiMethod = 'update';
  const self = this;
  const id = req.params.id;
  let filter = this.option('update', 'filter');
  const fields = this.option('update', 'fields');
  const populate = this.option('update', 'populate');
  const readonly = this.option('update', 'readonly');
  if (filter instanceof Function) filter = filter.call(this, req);
  const query = Object.assign({ }, filter, { _id: id });

  const method = self.option('update', 'method') || 'post';
  const data = flat(
    (method !== 'get') ? req.body : req.query,
    readonly
  );

  var dbQuery = this.model.findOneAndUpdate(
    query,
    {$set: data},
    {
      new: true,
      fields: fields,
      runValidators: true
    }
  );

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }

  dbQuery.exec(function(err, obj) {
    if (err) {
      if (err.name && err.name == "ValidationError") {
        return next(new ModelAPIError(422, err));
      }
      return next(err);
    };
    if (!obj) return next(new ModelAPIError(
      404, `The ${self.nameSingle} was not found by ${id}`
    ));
    res.status(200);
    res.json(obj);
  });

};

module.exports = exports = update;
