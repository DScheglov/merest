var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require('util');
var assert = require('assert');

var app = require('../setup/app');
var db = require('../setup/db');
var models = require('../models');
var api = require("../../lib");


var testPort = 30023;
var testUrl = 'http://localhost:' + testPort;

var people = require('../fixtures/people');

describe('Bad request fireing', function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("GET /api/v1/books?year__re=^19 400 -- error when getting books with year starts with 19", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__re=^19', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 400);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(
        body.message,
        'Cast to number failed for value "/^19/" at path "year" for model "Book"'
      );
      done();
    });

  });

  it("GET /api/v1/books?year=^19 400 -- error when getting books with year #19", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year=^19', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 400);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(
        body.message,
        'Cast to number failed for value "^19" at path "year" for model "Book"'
      );
      done();
    });

  });

});


describe('Bad request fireing (mongoose query object)', function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {
          search: {method: 'post', path: '/search'}
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("POST /api/v1/books/search 400 -- error when getting books wrong $exists value", function (done) {

    request.post({
      url: util.format('%s/api/v1/books/search', testUrl),
      json: {
        $and: [ { title: {$exstis: true }}, { description: {$exists: 1 } } ]
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 400);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.ok(body.message);
      done();
    });

  });

  it("POST /api/v1/books/search 400 -- error when getting books wrong $and value", function (done) {

    request.post({
      url: util.format('%s/api/v1/books/search', testUrl),
      json: {
        $and: { title: {$exstis: true } , description: {$exists: true } }
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 400);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.ok(body.message);
      done();
    });

  });

  it("POST /api/v1/books/search 400 -- error when getting books wrong $or value", function (done) {

    request.post({
      url: util.format('%s/api/v1/books/search', testUrl),
      json: {
        $or: { title: {$exstis: true } , description: {$exists: 1 } }
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 400);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.ok(body.message);
      done();
    });

  });


});
