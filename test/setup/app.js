var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var app, server;

module.exports = exports = {
  init: init,
  listen: listen,
  close: close,
  use: use
}

function init() {
  var callback = arguments[arguments.length-1];
  app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());
  callback();
}

function listen(port, callback) {
  callback = arguments[arguments.length-1];
  server = app.listen(port, callback);
}

function close(callback) {
  callback = arguments[arguments.length-1];
  if (server) server.close(function () {
    server = null;
    app = null;
    callback();
  });
}

function use() {
  app.use.apply(app, arguments);
}
