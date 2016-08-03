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
function Transformer(transform, status, body) {
  this.status = status || 200;
  this.body = body || {};
  transform.call(this);
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
    assert.equal(transform.length, 0);
  } catch(e) {
    console.error(e.message);
    return function (req, res, next) { return next(); }
  }

  var originalStatus, originalJson;

  return function (req, res, next) {
    originalStatus = res.status;
    originalJson = res.json;
    res.status = setStatus;
    res.json = sendJson;
    return next();
  }

  function setStatus(status) {
    this.__status = status;
    return this;
  }

  function sendJson(body) {
    var T = new Transformer(transform, this.__status, body);
    originalStatus.call(this, T.status);
    return originalJson.call(this, T.body);
  }

}
