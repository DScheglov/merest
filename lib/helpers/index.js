'use strict'

var mongoose = require('mongoose');
var _pjoin = require('path').posix.join;

module.exports = exports = {
  ensureMethodObj: ensureMethodObj,
  camel2giffen: camel2giffen,
  flat: flat,
  addController: addController,
  readMiddlwares: readMiddlwares,
  exposeMethods: exposeMethods
}


function ensureMethodObj(obj, defMethod) {
  if (obj === false) return false;
  if (obj == null) return {method: defMethod};
  if (typeof obj === 'object') {
    obj.method = obj.method || defMethod;
    return obj;
  }
  var newObj = {};
  if (typeof obj === 'string') {
    var val = obj.toLowerCase();
    if (ensureMethodObj.methods[val] === true) newObj.method = obj;
    else newObj.title = obj;
  }
  newObj.method = newObj.method || defMethod;
  return newObj;
}

ensureMethodObj.methods = {
  checkout: true,
  copy: true,
  delete: true,
  get: true,
  head: true,
  lock: true,
  merge: true,
  mkactivity: true,
  mkcol: true,
  move: true,
  'm-search': true,
  notify: true,
  options: true,
  patch: true,
  post: true,
  purge: true,
  put: true,
  report: true,
  search: true,
  subscribe: true,
  trace: true,
  unlock: true,
  unsubscribe: true
}

function camel2giffen(str) {
  var res = str
        .replace(/^([A-Z]+)/, function(m) {return m.toLowerCase();})
        .replace(/([A-Z]+)/g, function(m) {return "-"+m.toLowerCase();});
  return res;
};


function flat(obj) {
  var newObj = {};

  _flat('', obj);

  return newObj;

  function _flat(path, obj) {
    var i, k, v, p = Object.keys(obj);
    for (i=0; i<p.length;i++) {
      k = p[i];
      v = obj[k];
      if (v == null) newObj[path + k] = v;
      else if (v instanceof Array) newObj[path + k] = v;
      else if (typeof v === 'object') _flat(path + k + '.', v);
      else newObj[path + k] = v;
    }
  }
}


function addController(router, path, options, controller, description) {

  var mountPath = path;
  if (mountPath === '/:id') {
    mountPath = '/:id(' + router.apiOptions.matchId +')';
  }

  if (options.path) {
    mountPath = _pjoin(mountPath, options.path);
    path = _pjoin(path, options.path);
  }

  if (options.middlewares && options.middlewares.length) {
    router[options.method].apply(router, [mountPath].concat(options.middlewares));
  }

  router[options.method](mountPath, function (req, res, next) {
    return controller.call(router, req, res, next);
  });

  if (description !== false) {
    var title = options.title || description;
    router._urls.push([
        options.method,
        _pjoin(router.path, path),
        title
    ]);
    router._controllers.push({
      path: _pjoin(router.path, path),
      method: options.method,
      controller: controller,
      title: title,
      model: router.model,
      router: router
    });
  }

}


function exposeMethods(router, basePath, expose, methods, handler) {
  var staticPath = basePath.indexOf(":id") < 0 ? "statics." : "";
  var allowed = expose;
  var allowedAll = allowed['*'] === true;
  var methods = (allowedAll)?Object.keys(methods):Object.keys(allowed);
  var needToAdd;
  for (var p in allowed) {
    needToAdd = (
      p != '*' &&
      allowed.hasOwnProperty(p) &&
      methods.indexOf(p) < 0
    );
    if (needToAdd) methods.push(p)
  }
  var method = "";
  for (var i=0;i<methods.length;i++) {
    let methodName = methods[i], methodTitle, methodPath, methodOptions;

    if (allowedAll && allowed[methodName] === false) continue;
    if (!(allowedAll || allowed[methodName])) continue;

    allowed[methodName] =
    methodOptions = ensureMethodObj(allowed[methodName], 'post');

    methodOptions.path = methodOptions.path || camel2giffen(methodName);
    methodTitle = methodOptions.title ||
                  router.nameSingle + '.' + staticPath + methodName;
    //methodPath = _pjoin(basePath, methodPath);
    addController(
      router, basePath, methodOptions,
      function(req, res, next) {
        return handler.call(router, methodName, req, res, next);
      },
      methodTitle
    )
  };
};

function isModel(m) {
  return (m && m.schema && m.schema instanceof mongoose.Schema);
}

function isPureFunction(f) {
  return (f instanceof Function && !isModel(f));
}

function readMiddlwares(args, startIndex) {
  var i = startIndex || 0;
  var middlewares = [];
  if (args instanceof Function) {
    return [args];
  }

  while (isPureFunction(args[i])) middlewares.push(args[i++]);

  return (middlewares.length)?middlewares:null;

}
