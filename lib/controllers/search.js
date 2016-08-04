var extend = require('util')._extend;
var ModelAPIError = require('../model-api-error');


/**
 * search - Searches the objects in attached model collection
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIRouter
 */
function search(req, res, next) {
  res.__apiMethod = 'search';
  buildQuery.call(this, req).exec(function (err, obj) {
    if (err) return next(err);
    res.json(obj);
  });

};



function buildQuery(req) {
  var method = this.option('search', 'method').toLowerCase();
  var query = {};

  query = extend({}, (method !== "get") ? req.body : req.query);
  if (method == "get") {
    if (query._sort) delete query._sort;
    if (query._limit) delete query._limit;
    if (query._skip) delete query._skip;
  }
  if (this.apiOptions.queryFields) {
    var keys = Object.keys(query);
    var i = keys.length;
    while (i--) {
      if (!this.apiOptions.queryFields[keys[i]]) delete query[keys[i]];
    }
  }

  var skip = this.option('search', 'skip') && req.query._skip;
  var limit = this.option('search', 'limit') && req.query._limit;
  var sort = this.option('search', 'sort') && req.query._sort;
  var fields = this.option('search', 'fields');
  var populate = this.option('search', 'populate');
  var filter = this.option('search', 'filter');
  if (filter instanceof Function) filter = filter.call(this, req);
  extend(query, filter);
  var dbQuery = this.model.find(query, fields);

  if (sort) {
    var sortParams = sort.split(/[,;]/);
    var l = sortParams.length;
    var r;
    var sortFields = this.option('search', 'sort') || null;
    var allowedAll = (sortFields == null) || (sortFields === true);
    sort = [];
    for (var i=0;i<l;i++) {
      r = /^([+-]?)([^+-]+)([+-]?)$/.exec(sortParams[i]);
      if (r) {
        if (allowedAll || sortFields[r[2]]) {
          sort.push(
            ((r[1]=="-"||r[3]=="-")?"-":"") + r[2]
          );
        }
      }
    }
    if (sort.length) {
      dbQuery = dbQuery.sort(sort.join(" "));
    }
  }

  if (skip) {
    dbQuery = dbQuery.skip(parseInt(skip, 10));
  }
  if (limit) {
    dbQuery = dbQuery.limit(parseInt(limit, 10));
  }

  if (populate) {
    dbQuery = dbQuery.populate(populate);
  }
  return dbQuery;
}

module.exports = exports = search;
