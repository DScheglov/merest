'use strict';

const ModelAPIError = require('../model-api-error');
const parseRegExp = require('../helpers').parseRegExp;


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

function cleanQuery(router, query) {
  let allowedFields = router.option('search', 'queryFields');
  if (allowedFields) {
    query = Object.keys(query).reduce(
      (q, k) => {
        let p = parseParam(k);
        let c = allowedFields[p.name];
        if (!c) { delete q[k]; return q }
        if (typeof c !== 'object') return q;
        p.oper = p.oper || 'eq';
        if (!c[p.oper]) delete q[k];
        return q;
      }, query
    );
  }
  return query;
}

function buildQuery(req) {
  var method = this.option('search', 'method').toLowerCase();
  var query = {};

  query = Object.assign({}, (method !== 'get') ? req.body : req.query);
  if (method === 'get') {
    if (query._sort) delete query._sort;
    if (query._limit) delete query._limit;
    if (query._skip) delete query._skip;
    query = cleanQuery(this, query);
    query = Object.keys(query).reduce(
      (q, k) => parseFieldQuery(q, k, q[k]), query
    );
  } else {
    query = cleanQuery(this, query);
  }
  const skip = this.option('search', 'skip') && req.query._skip;
  let limit = this.option('search', 'limit');
  if (typeof limit === 'boolean') {
    limit = limit && req.query._limit;
  } else if (typeof limit === 'number') {
    let _l = parseInt(req.query._limit, 10);
    limit = _l < limit ? _l : limit;
  } else limit = null;

  let sortFields = this.option('search', 'sort');
  let sort = sortFields && req.query._sort;

  let fields = this.option('search', 'fields');
  let populate = this.option('search', 'populate');
  let filter = this.option('search', 'filter');
  if (filter instanceof Function) filter = filter.call(this, req);
  query = Object.assign(query, filter);
  let dbQuery = this.model.find(query, fields);

  if (sort) {
    let sortParams = sort.split(/[,; ]/);
    let allowedAll = (sortFields == null) || (sortFields === true);
    sort = sortParams.reduce(
      (s, p) => {
        let r = /^([+-]?)([^+-]+)([+-]?)$/.exec(p);
        if (allowedAll || sortFields[r[2]]) {
          s.push( ((r[1]=="-"||r[3]=="-")?"-":"") + r[2]);
        }
        return s
      }, []
    )
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
    value = parseRegExp(value);
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

function parseParam(fld) {
  let param = /^(.+?)(?:__(lt|lte|gt|gte|ne|in|nin|re|ex))?$/.exec(fld);
  return {
    name: param[1],
    oper: param[2]
  };
}

module.exports = exports = search;
