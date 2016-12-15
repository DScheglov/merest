var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require("util");
var assert = require('assert');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');

var db = require('../setup/db');
var models = require('../models');
var api = require("../../lib");


var testPort = 30023;
var testUrl = 'http://127.0.0.1:' + testPort;

describe("Using ModelAPIExpress as main application", function (done) {
  var server, modelAPI;
  before(function (done) {

    async.waterfall([
      db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        modelAPI = new api.ModelAPIExpress();
        modelAPI.use(bodyParser.json());
        modelAPI.use(bodyParser.urlencoded({ extended: true }));
        modelAPI.use(methodOverride());
        modelAPI.expose(models.Person);
        server = modelAPI.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([
      db.close,
      server.close.bind(server),
      function () {
        var callback = arguments[arguments.length - 1];
        server = null;
        modelAPI = null;
        callback()
    }], done)
  });

  it("OPTIONS / 200 -- get options for whole API", function (done) {

    request.post({
      url: testUrl,
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
      }
    }, function (err, res, body) {
          assert.ok(!err);
          assert.equal(res.statusCode, 200);
          if (typeof(body) == "string") {
            body = JSON.parse(body);
          }
          assert.equal(body.length, 7);
          done();
    });

  });

  it("OPTIONS /people 200 -- get options for People API", function (done) {

    request.post({
      url: util.format('%s/people', testUrl),
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
      }
    }, function (err, res, body) {
          assert.ok(!err);
          assert.equal(res.statusCode, 200);
          if (typeof(body) == "string") {
            body = JSON.parse(body);
          }
          assert.equal(body.length, 6);
          done();
    });

  });

});


describe("Exposing model with middleware and custom path", function (done) {
  var server, modelAPI;

  function checkHeader(req, res, next) {
    if (req.headers['x-some-auth'] === 'correct-password') return next();
    next(new api.ModelAPIError(401, 'Access denied'));
  }

  before(function (done) {

    async.waterfall([
      db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        modelAPI = new api.ModelAPIExpress();
        modelAPI.use(bodyParser.json());
        modelAPI.use(bodyParser.urlencoded({ extended: true }));
        modelAPI.use(methodOverride());
        modelAPI.expose('/internal', checkHeader, models.Person);
        server = modelAPI.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([
      db.close,
      server.close.bind(server),
      function () {
        var callback = arguments[arguments.length - 1];
        server = null;
        modelAPI = null;
        callback()
    }], done)
  });

  it('GET /internal 401 -- trying to get persons without password', function(done) {
    request.get({
      url: util.format('%s/internal', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 401);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.error, true);
      assert.equal(body.message, "Access denied");
      done();
    });
  });

  it('GET /internal 200 -- trying to get persons within correct password', function(done) {
    request.get({
      url: util.format('%s/internal', testUrl),
      headers: {
        'x-some-auth': 'correct-password'
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 4);
      done();
    });
  });

});
