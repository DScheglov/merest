'use strict';

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
    if (err) {
      var isCastError =
        (err.name === 'CastError') ||
        (err.message && err.message[0] === '$') ||
        (err.message === 'and needs an array')
      ;

      if (isCastError) return next(
        new ModelAPIError(400, err.message)
      );

      return next(err);
    }
    res.json(obj);
  });

};



function buildQuery(req) {
  var method = this.option('search', 'method').toLowerCase();
  var query = {};

  query = extend({}, (method !== 'get') ? req.body : req.query);
  if (method === 'get') {
    if (query._sort) delete query._sort;
    if (query._limit) delete query._limit;
    if (query._skip) delete query._skip;
    query = Object.keys(query).reduce(
      (q, k) => parseFieldQuery(q, k, q[k]), query
    );
    console.dir(query, {depth: null});
  }

  if (this.apiOptions.queryFields) {
    var allowedFields = this.apiOptions.queryFields;
    query = Object.keys(query).reduce(
      (q, k) => allowedFields[k] ? q : (delete q[k]) && q, query
    );
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

function parseFieldQuery(obj, name, value) {
  var newValue = { };
  var param = /^(.+?)(?:__(lt|lte|gt|gte|ne|in|nin|re|ex))?$/.exec(name);
  var oper = param[2];
  if (oper == null) return obj;
  delete obj[name];
  name = param[1];

  if (oper === 're') {
    try {
      var parts = value.split('/');
      switch (parts.length) {
        case 1: value = new RegExp(parts[0]); break;
        case 3: value = new RegExp(parts[1], parts[2]);
      }
    } catch (e) { }
    oper = null;
  } else if (oper === 'ex') {
    oper = 'exists';
    value = !(/^(no|false|0)$/i.test(value));
  } else if (/^(in|nin)$/.test(oper)) {
    value = value.toString().split(',');
  }

  if (obj[name]) {
    if (oper) {
      newValue[name] = {};
      newValue[name][`$${oper}`] = value;
    } else newValue[name] = value;
    obj.$and = obj.$and || [];
    obj.$and.push(newValue);
  } else {
    obj[name] = obj[name] || {};
    if (oper) obj[name][`$${oper}`] = value;
    else obj[name] = value;
  }
  return obj;
}

module.exports = exports = search;
