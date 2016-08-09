var assert = require('assert');

module.exports = exports = transformResponse;


/**
 * Bundle - class to aggregate data to be changed
 *
 * @param  {Function} transform the function transforms `this.status` and `this.body`
 * @param  {Number} status      HTTP Response code
 * @param  {Any} body           The Body to be changed
 * @return {Transformer}        created transformed option
 */
function Bundle(transform, req, res) {
  this.status = res.__status || 200;
  this.body = res.__body || {};
  this.apiMethod = res.__apiMethod;
  this.apiInstanceMethod = res.__apiInstanceMethod;
  this.apiStaticMethod = res.__apiStaticMethod;
  this.api = res.__api;
  this.modelAPI = res.__modelAPI;
  if (this.modelAPI) {
    this.model = this.modelAPI.model.modelName;
  }
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
    this.__body = body;
    var B = new Bundle(transform, reqClosure, this);
    originalStatus.call(this, B.status);
    return originalJson.call(this, B.body);
  }

}
