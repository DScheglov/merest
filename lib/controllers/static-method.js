
/**
* callStaticMethod - controller that calls a static method of model
*
* @param  {String}           methodName the name of method that should be called
* @param  {express.Request}  req        the http(s) request
* @param  {express.Response} res        the http(s) response
* @param  {Function}         next       the callback should be called if controller fails
*
* @memberof ModelAPIRouter
*/
function callStaticMethod(methodName, req, res, next) {
  var self = this;
  var methodOptions = this.apiOptions.exposeStatic[methodName] || {};

  var wrapper = methodOptions.exec;
  if (!(wrapper instanceof Function)) wrapper = null;

  var httpMethod = methodOptions.method || 'post';
  var params = (httpMethod !== 'get') ? req.body : req.query;

  var mFunc = wrapper || this.model[methodName];

  mFunc.call(this.model, params, function(err, result) {
    if (err) return next(err);
    res.json(result);
  });
};

module.exports = exports = callStaticMethod;
