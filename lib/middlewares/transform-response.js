var assert = require('assert');

module.exports = exports = transformResponse;


/**
 * Transformer - class to aggregate data to be changed
 *
 * @param  {Function} transform the function transforms `this.status` and `this.body`
 * @param  {Number} status      HTTP Response code
 * @param  {Any} body           The Body to be changed
 * @return {Transformer}        created transformed option
 */
function Transformer(transform, status, body, req, res) {
  this.status = status || 200;
  this.body = body || {};
  this.apiMethod = res.__apiMethod;
  if (res.__apiInstanceMethod) {
    this.apiInstanceMethod = res.__apiInstanceMethod;
  }
  if (res.__apiStaticMethod) {
    this.apiStaticMethod = res.__apiStaticMethod;
  }
  this.api = res.__api;
  this.modelAPI = res.__modelAPI;
  transform.call(this, req, res);
}

/**
 * transformResponse - the factory for middleware that transforms response
 *
 * @param  {Function} transform the function transfomrs `this.status` and `this.body`
 * @return {Function}           express middleware that transfomrs response
 */
function transformResponse(transform) {
  try {
    assert.ok(transform);
    assert.ok(transform instanceof Function);
  } catch(e) {
    return function (req, res, next) { return next(); }
  }

  var originalStatus, originalJson, reqClosure;

  return function (req, res, next) {
    originalStatus = res.status;
    originalJson = res.json;
    reqClosure = req;
    res.status = setStatus;
    res.json = sendJson;
    return next();
  }

  function setStatus(status) {
    this.__status = status;
    return this;
  }

  function sendJson(body) {
    var T = new Transformer(transform, this.__status, body, reqClosure, this);
    originalStatus.call(this, T.status);
    return originalJson.call(this, T.body);
  }

}
