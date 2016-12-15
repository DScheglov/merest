'use strict';

var express = require('express');
var mongoose = require('mongoose');
var ModelAPIRouter = require('./model-api-router');
var ModelAPIError = require('./model-api-error');
var controllers = require('./controllers');
var middlewares = require('./middlewares');

var path = require('path');

var readMiddlwares = require('./helpers').readMiddlwares;

/**
 * @class ModelAPIExpress - Express application that provides an RESTfull API for different models
 *
 * @param  {Object} options          optional, object with options
 * @param  {String} options.title    the title of API <SWAGGER>
 * @param  {String} options.path     The path of api root. The application doesn't mount it self on this path. <SWAGGER>
 * @param  {String} options.host     The host to reach API. <SWAGGER>
 * @param  {Boolean} [options.options]  allows or denies the OPTION end-point on the application level
 * @param  {Function} [options.transformResponse] the function to transform standard response. For details see Transform response
 * @return {ModelAPIExpress}         Created API application
 */
function ModelAPIExpress(options) {
  options = options || {};
  var app = express();
  app.__proto__ = ModelAPIExpress.prototype;
  app.$__ = {};
  app.$__.options = options;
  app._urls = [];
  app._urlsDefined = false;

  app.use(middlewares.registerApi(true, this));

  var transformResponse = options.transformResponse instanceof Function ?
    options.transformResponse :
    null
  ;

  if (transformResponse) {
    app.use(middlewares.transformResponse(transformResponse));
  }

  app.on('mount', app.__finalize.bind(app));

  var __originalListen = app.listen;
  app.listen = function() {
    app.__finalize();
    return __originalListen.apply(app, arguments);
  }

  return app;
};

ModelAPIExpress.prototype = Object.create(Function.prototype);
ModelAPIExpress.prototype.constructor = ModelAPIExpress;

/**
 * SWAGGER_SUPPORT indicates that the module version supports the swagger
 */
ModelAPIExpress.prototype.SWAGGER_SUPPORT = true;

/**
 * ModelAPIExpress.prototype.expose - exposes the mongoose model as RESTFull json service
 *
 * @param  {String} [path]               the path to mount exposed model
 * @param  {Function} [middleware]    one or more middlewares that should be called before each end-point controller
 * @param  {Mongoose.Model} model        Mongoosee model to be exposed
 * @param  {Object} [routerOptions]        ModelAPIRouter configuration object (see [Router configuration](configuration.html#router))
 * @return {ModelAPIExpress}             itself
 */
ModelAPIExpress.prototype.expose = function(path, middleware, model, routerOptions) {
  var options, si = 0, ml;
  path = arguments.length && arguments[0];
  if (typeof path === "string") {
    si = 1;
  } else {
    path = null;
  }
  var middlewares = readMiddlwares(arguments, si);
  ml = middlewares && middlewares.length || 0;

  model = arguments[ml + si];
  options = arguments[ml + si + 1] || {};
  if (path) { options.path = path }
  if (ml) { options.middlewares = middlewares }

  var router = new ModelAPIRouter(model, options);
  this.__attachOptions();
  router.attachTo(this);
  return this;
};

/**
 * ModelAPIExpress.prototype.__attachOptions - attaches the options controller
 *
 * @private
 */
ModelAPIExpress.prototype.__attachOptions = function() {
  var app = this;
  var options = app.$__.options;
  if (options && !(options.options === false) && !options.optionsAttached) {
    app.options('/', controllers.options.bind(app));
    app._urls.push([
      'options', '/', 'List all end-points of current application'
    ]);
    options.optionsAttached = true;
  }
}

/**
 * ModelAPIExpress.prototype.urls - returns avaliable list of end-points
 *
 * @return {Array}  list of end-points
 */
ModelAPIExpress.prototype.urls = function() {
  if (this._urlsDefined) return this._urls;
  if (!this.mountpath) return [];
  if (!this.__routers || !this.__routers.length) return [];

  this._urlsDefined = true;
  if (this.mountpath != '/') {
    for (var i=0; i<this._urls.length; i++) {
      this._urls[i][1] = path.join(this.mountpath, this._urls[i][1]);
    }
  }
  var router;
  for (var i=0; i<this.__routers.length; i++) {
    router = this.__routers[i];
    this._urls = this._urls.concat(router.urls(this.mountpath));
  }
  return this._urls;
}

/**
 * @private
 */
ModelAPIExpress.prototype.__addModelAPIrouter = function(router) {

  this.__routers = this.__routers || [];
  if (this.__routers.indexOf(router) >= 0) return this;
  this.__routers.push(router);
}

/**
 * @private
 */
ModelAPIExpress.prototype.__finalize = function() {
  this.use(controllers.notSupported);
  this.use(controllers.error);
  this.urls();
}

module.exports = exports = ModelAPIExpress;
