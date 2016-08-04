var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');
var flat = require('../helpers').flat;

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
  var self = this;
  var id = req.params.id;
  var filter = this.option('update', 'filter');
  var fields = this.option('update', 'fields');
  var populate = this.option('update', 'populate');
  if (filter instanceof Function) filter = filter.call(this, req);
  var query = extend({_id: id}, filter);

  var method = self.option('update', 'method') || 'post';
  var data = (method !== 'get') ? req.body : req.query;
  var toUpdate = flat(data);
  var dbQuery = this.model.findOneAndUpdate(
    query,
    {$set: toUpdate},
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
