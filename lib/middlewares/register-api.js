
module.exports = exports = registerApi;

/**
 * registerApi - the factory for middleware that registers api in response object
 *
 * @param  {ModelAPIRouter|ModelAPIExpress} apiObject the ModelAPIRouter or ModelAPIRouter
 * @return {Function}           description
 */
function registerApi(isApp, apiObject) {

  if (isApp) {
    return function (req, res, next) {
      res.__api = apiObject;
      return next();
    };
  };
  
  return function (req, res, next) {
    res.__modelAPI = apiObject;
    return next();
  };
}
