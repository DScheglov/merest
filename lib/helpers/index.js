'use strict'

const mongoose = require('mongoose');
const _pjoin = require('path').posix.join;

module.exports = exports = {
  ensureMethodObj: ensureMethodObj,
  camel2giffen: camel2giffen,
  flat: flat,
  addController: addController,
  readMiddlwares: readMiddlwares,
  exposeMethods: exposeMethods,
  parseRegExp: parseRegExp,
  normalizeReadonly: normalizeReadonly
}


function ensureMethodObj(obj, defMethod) {
  if (obj === false) return false;
  if (obj == null) return { method: defMethod };
  if (typeof obj === 'object') {
    obj.method = obj.method || defMethod;
    if (obj.hasOwnProperty('readonly')) {
      obj.readonly = normalizeReadonly(obj.readonly);
    }
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


function flat(obj, exclude) {
  return _flat('', obj, exclude, { });
}

function _flat(path, obj, exclude, flatted) {

  return Object.keys(obj).reduce(
    (f, p) => {
      let np = path + p;
      if (exclude && exclude[np]) return f;
      let v = obj[p];
      if (v && !Array.isArray(v) && typeof(v) === 'object') {
        return _flat(np + '.', v, exclude, f);
      }
      f[np] = v;
      return f;
    }, flatted
  )
}

function addController(router, endPoint, path, options, controller, description) {

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
    var exposedMethod;
    if (endPoint.indexOf(':')>=0) {
      endPoint = endPoint.split(':');
      exposedMethod = endPoint[1];
      endPoint = endPoint[0];
    }
    router._controllers.push({
      endPoint: endPoint,
      exposedMethod: exposedMethod,
      path: _pjoin(router.path, path),
      method: options.method,
      controller: controller,
      title: title,
      model: router.model,
      router: router,
      options: options
    });
  }

}


function exposeMethods(router, basePath, expose, methods, handler) {
  const staticPath = basePath.indexOf(":id") < 0 ? "statics." : "";
  var allowed = Object.keys(expose);
  var allowedAll = expose['*'] === true;
  var methods = (allowedAll)?Object.keys(methods):allowed;

  allowed.reduce( (methods, m) => {
    if (m === '*') return methods;
    if (methods.indexOf(m) < 0) methods.push(m)
    return methods;
  }, methods);

  methods.forEach(methodName => {
    let methodTitle, methodPath, methodOptions, endPoint;
  });

  for (var i=0;i<methods.length;i++) {
    let methodName = methods[i], methodTitle, methodPath, methodOptions, endPoint;

    if (allowedAll && allowed[methodName] === false) continue;
    if (!(allowedAll || allowed[methodName])) continue;

    allowed[methodName] = methodOptions = ensureMethodObj(
      allowed[methodName], 'post'
    );

    methodOptions.path = methodOptions.path || camel2giffen(methodName);
    endPoint = router.nameSingle + '.' + staticPath + methodName;
    methodTitle = methodOptions.title || endPoint;
    //methodPath = _pjoin(basePath, methodPath);
    addController(
      router,
      handler.name + ':' + endPoint, basePath, methodOptions,
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

  while (isPureFunction(args[i])) middlewares.push(args[i++]);

  return (middlewares.length)?middlewares:null;

}

function parseRegExp(str) {
  var s = str;
  var start = str.indexOf('/');
  var end = str.lastIndexOf('/');
  var options;
  if (start >= 0 && start < end) {
    options = str.substring(end + 1);
    str = str.substring(start + 1, end);
  }
  try {
    return new RegExp(str, options)
  } catch(e) {
    return s;
  }
}

function normalizeReadonly(val, def) {
  if (!val) {
    return def && Object.assign({}, def)
  }
  if (typeof val === 'string') val = val.split(/\s/);

  if (Array.isArray(val) && val.length) {
    val = val.reduce( (o, v) => (o[v] = true) && o, {});
  }

  if (typeof val !== 'object' || !Object.keys(val).length) {
    return def && Object.assign({}, def)
  }

  return Object.assign(val, def);
}
