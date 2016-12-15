var path = require('path').posix;
var express = require('express');
var Router = express.Router;
var mongoose = require('mongoose');
var helpers = require('./helpers');
var ModelAPIError = require('./model-api-error');
var controllers = require('./controllers');
var middlewares = require('./middlewares');

var ensureMethodObj = helpers.ensureMethodObj;
var camel2giffen = helpers.camel2giffen;
var flat = helpers.flat;
var addController = helpers.addController;
var exposeMethods = helpers.exposeMethods;

/**
 * @class ModelAPIRouter - express router dispatches REST-calls to api-controllers
 *
 * @param  {mongoose.Model|String}  model    model to be exposed
 * @param  {Object}                 [options]  router configuration object
 * @param  {Object|Boolean}         [options.options]   options for OPTIONS http-method
 * @param  {Object|Boolean}         [options.create]    options for CREATE REST-method
 * @param  {Object|Boolean}         [options.search]    options for SEARCH(LIST) REST-method
 * @param  {Object|Boolean}         [options.details]   options for DETAILS REST-method
 * @param  {Object|Boolean}         [options.update]    options for UPDATE REST-method
 * @param  {Object|Boolean}         [options.delete]    options for DELETE REST-method
 * @param  {Object|Boolean}         [options.expose]    options for exposing methods of model
 * @param  {Object|Boolean}         [options.exposeStatic]   options for exposing static model methods
 * @param  {String}                 [options.path]      the path to mount router (levels: router|METHOD)
 * @param  {Object|Function}        [options.filter]    the mongodb-filter object or function that returns the same type object (levels: router|METHOD)
 * @param  {Object}                 [options.fields]    the mongodb-fields descriptor (levels: router|METHOD)
 * @param  {Object}                 [options.queryFields]  the object with keys that defines allow to use field in query or not
 * @param  {String|Object|Array}    [options.popuplate] the mongoose population descriptor (levels: router|METHOD)
 * @param  {Boolean}                [options.skip]      the flag to allow or deny skipping documents (levels: router|METHOD)
 * @param  {Boolean}                [options.limit]     the flag to allow or deny limit documents number (levels: router|METHOD)
 * @param  {Object|Boolean}         [options.sort]      the flag or an object that defines fields to be used for documents corting (levels: router|METHOD)
 * @param  {Function|Array}         [options.middlewares]  the Function or Array of Function that should be called before the router controller will be called (levels: router|METHOD)
 * @param  {String|RegExp}          [options.matchId]   the String or RegExp that allows to identify values of _id to build correct routing paths
 * @param  {String}                 [options.title]     the short description of the path
 * @return {ModelAPIRouter}                  created router
 */
function ModelAPIRouter(model, options) {
  options = options || {};

  var router = Router();
  router.__proto__ = ModelAPIRouter.prototype;
  //
  router.application = null;
  router.model = (typeof model === 'string') ? mongoose.model(model) : model;
  router.apiOptions =  router.__applyOptions(options)
  router.middlewares = router.apiOptions.middlewares;
  //
  router.nameSingle = options.apiName || router.model.modelName;
  router.nameSingleURI = camel2giffen(router.nameSingle);
  router.plural = options.plural || router.model.collection.name;
  router.pluralURI = camel2giffen(router.plural);
  router.path = router.apiOptions.path || ('/' + router.pluralURI);

  router.__configureProperties();
  return router;
}

ModelAPIRouter.prototype = Object.create(Router);
ModelAPIRouter.prototype.constructor = ModelAPIRouter;

/**
 * ModelAPIRouter.prototype.__configureProperties - configures properties of object
 *
 * @private
 */
ModelAPIRouter.prototype.__configureProperties = function() {
  Object.defineProperties(this, {
    application: {writeable: true, enumerable: false},
    apiOptions: {writeable: false, enumerable: false},
    model: {writeable: false, enumerable: false},
    middleware: {wrtitable: false, enumerable: false},
  });
}

/**
 * ModelAPIRouter.prototype.__applyOptions - overrides default options by custom options
 *
 * @param  {Object} options Custom options for model exposition
 * @return {Object}         The overrided options
 *
 * @private
 */
ModelAPIRouter.prototype.__applyOptions = function(options) {
  options = options || {};

  var theOptions = {
    options: ensureMethodObj(options.options, 'options'),
    create: ensureMethodObj(options.create, 'post'),
    search: ensureMethodObj(options.search, 'get'),
    details: ensureMethodObj(options.details, 'get'),
    update: ensureMethodObj(options.update, 'post'),
    delete: ensureMethodObj(options.delete, 'delete'),
    expose: options.expose || {
      '*': false
    },
    exposeStatic: options.exposeStatic || {
      '*': false
    },

    // default options for all methods
    path: options.path || null,
    filter: options.filter || null,
    fields: options.fields || {},
    readonly: null,
    queryFields: options.queryFields || null,
    sortFields: options.sortFields || null,
    populate: options.populate || null,
    skip: options.skip == null ? true : options.skip,
    limit: options.limit == null ? true : options.limit,
    sort: options.sort == null ? true : options.sort,
    middlewares: options.middlewares || null,
    matchId: options.matchId || options.id || '[a-f\\d]{24}',
    title: options.title || ''
  };

  return theOptions;

};

/**
 * ModelAPIRouter.prototype.option - defines options for certain method
 *
 * @param  {String} method  the method which option should be defined
 * @param  {String} name    the name of option
 * @return {*}              defined option value
 *
 * @private
 */
ModelAPIRouter.prototype.option = function(method, name) {
  var methodOptions = this.apiOptions[method];
  if (methodOptions && methodOptions[name] != undefined) {
    return methodOptions[name];
  }
  return this.apiOptions[name];
}


/**
 * ModelAPIRouter.prototype.attachTo - attaches the router to the ModelAPIExpress
 *
 * @param  {ModelAPIExpress} app    the API Application to which the router should be mounted
 * @return {ModelAPIRouter}         self
 *
 */
ModelAPIRouter.prototype.attachTo = function(app) {
  if (this.application) return this;
  this.application = app;
  this.application.__addModelAPIrouter(this);
  this.__init();
  if (this.middlewares && this.middlewares.length) {
    var args = [this.path];
    args = args.concat(this.middlewares);
    this.application.use.apply(this.application, args);
  }
  this.application.use(this.path, this);
  return this;
}


/**
 * ModelAPIRouter.prototype.urls - returns avaliable urls
 *
 * @param  {String} rootPath  the path to the router (before it)
 * @return {Array}            the list of avaliable urls
 */
ModelAPIRouter.prototype.urls = function(rootPath) {
  if (this.rootPath && this._urls) return this._urls;
  this._urls = this._urls || [];
  if (rootPath) {
    this.rootPath = rootPath;
    for (var i=0; i<this._urls.length; i++) {
      this._urls[i][1] = path.join(rootPath, this._urls[i][1]);
    }
  }

  return this._urls;
}


/**
 * ModelAPIRouter.prototype.__init - initializes routes
 *
 * @private
 */
ModelAPIRouter.prototype.__init = function() {
  var self = this;
  this._urls = [];
  this._controllers = [];
  var path = "/";

  this.use(middlewares.registerApi(false, this));

  if (this.apiOptions.options) {
    addController(this, 'options', path, this.apiOptions.options,
      controllers.options, "List API-options for "+this.plural)
  } else {
    addController(this, null, path, {method: 'options'},
      controllers.notSupported, false)
  }


  if (this.apiOptions.search) {
    addController(this, 'search', path, this.apiOptions.search,
      controllers.search, "List/Search all "+this.plural)
  }

  if (this.apiOptions.create) {
    addController(this, 'create', path, this.apiOptions.create,
      controllers.create, "Create a new "+this.nameSingle)
  }

  exposeMethods(this, path,
                this.apiOptions.exposeStatic, this.model.schema.statics,
                controllers.callStaticMethod);

  path = "/:id";

  if (this.apiOptions.details) {
    addController(this, 'findById', path, this.apiOptions.details,
      controllers.find.bind(this, 'details'), "Find a "+this.nameSingle+" by Id")
  }

  if (this.apiOptions.update) {
    addController(this, 'update', path, this.apiOptions.update,
      controllers.update,
      "Find a "+this.nameSingle+" by Id and update it (particulary)")
  }

  if (this.apiOptions.delete) {
    addController(this, 'delById', path, this.apiOptions.delete,
      controllers.delete,
      "Find a "+this.nameSingle+" by Id and delete it.")
  }

  exposeMethods(this, path,
                this.apiOptions.expose, this.model.schema.methods,
                controllers.callInstanceMethod);
}

module.exports = exports = ModelAPIRouter;
