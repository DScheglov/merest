'use strict';

const async = require('async');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = {
    init: initialize,
    fixtures: fixtures,
    close: close
}

function initialize(callback) {
  callback = arguments[arguments.length-1];
  var dbName = `_${mongoose.Types.ObjectId()}_${Date.now()}`;
  mongoose.connect('mongodb://127.0.0.1/db'+dbName, callback)
}

function fixtures(data, callback) {
  callback = arguments[arguments.length-1];
  async.forEachOf(data, function(rows, model, next) {
    if (typeof rows === 'string') rows = require(rows);
    mongoose.model(model).collection.insert(rows, next);
  }, callback);
}

function close(callback) {
  callback = arguments[arguments.length-1];
  mongoose.connection.db.dropDatabase();
  mongoose.connection.close(callback);
}
