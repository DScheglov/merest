'use strict'

const mongoose = require('mongoose');
const _pjoin = require('path').posix.join;
const ModelAPIError = require('../model-api-error');

module.exports = exports = {
  ensureMethodObj: ensureMethodObj,
  camel2giffen: camel2giffen,
  flat: flat,
  addController: addController,
  readMiddlwares: readMiddlwares,
  exposeMethods: exposeMethods,
  parseRegExp: parseRegExp,
  normalizeReadonly: normalizeReadonly,
  validateReadonly: validateReadonly
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


function flat(obj) {
  return _flat('', obj, { });
}

function _flat(path, obj, flatted) {

  return Object.keys(obj).reduce(
    (f, p) => {
      let np = path + p;
      let v = obj[p];
      if (v && !Array.isArray(v) && typeof(v) === 'object') {
        return _flat(np + '.', v, f);
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
  let allowed = Object.keys(expose);
  let allowedAll = (expose['*'] === true);

  if (allowedAll) {
    methods = Object.keys(methods).concat(
      allowed.filter(m => m !== '*' && !methods[m])
    );
  } else {
    methods = allowed;
  }

  methods.forEach(methodName => {
    if (allowedAll && expose[methodName] === false) return;
    if (!allowedAll && !expose[methodName]) return;

    let methodTitle, methodPath, methodOptions, endPoint;

    expose[methodName] = methodOptions = ensureMethodObj(
      expose[methodName], 'post'
    );

    methodOptions.path = methodOptions.path || camel2giffen(methodName);
    endPoint = router.nameSingle + '.' + staticPath + methodName;
    methodTitle = methodOptions.title || endPoint;

    addController(
      router,
      handler.name + ':' + endPoint, basePath, methodOptions,
      function(req, res, next) {
        return handler.call(router, methodName, req, res, next);
      },
      methodTitle
    )

  });

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

function normalizeReadonly(val) {
  if (!val) return null;

  if (typeof val === 'string') val = val.split(/\s+/);

  if (Array.isArray(val) && val.length) {
    val = val.reduce( (o, v) => (o[v] = true) && o, {});
  }

  if (typeof val !== 'object' || !Object.keys(val).length) {
    return null
  }

  return Object.keys(val).reduce( (a, p) => {
    let v = val[p];
    if (!v) return a;
    let strict = /^[^!]+!$/.test(p);

    if (strict) p = p.substr(0, p.length - 1);

    let s = p.split('.').map(f => {
      switch(f) {
        case '*' : return '[^.]+'
        case '**': return '([^.]+\\.?)*'
      }
      return f;
    }).join('\\.');
    a.push({
      name: p,
      path: new RegExp(`^${s}$`),
      strict: strict,
      message: (typeof(v) === 'string') ?
        v :
        strict && `Couldn't modify path <${p}>` || null
    })

    return a;
  }, [ ]);

}

function validateReadonly(data, rules) {
  let errors = { _isError: false };
  data = Object.keys(data).reduce( (o, p) => {
    for (let rule of rules) {
      if (!validatePathWithRule(p, rule, errors)) return o;
    }
    o[p] = data[p];
    return o;
  }, { });
  if (errors._isError) {
    delete errors._isError;
    throw new ModelAPIError(422, 'Readonly constraint vialated', errors);
  }
  return data;
}

function validatePathWithRule(path, rule, errors) {
  if (!rule.path.test(path)) return true;
  if (rule.strict) {
    errors._isError = true;
    errors[path] = {
      type: 'readonly',
      message: rule.message,
      path: path
    }
  }
  return false;
}
