var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require("util");
var assert = require('assert');

var app = require('../setup/app');
var db = require('../setup/db');
var models = require('../models');
var api = require("../../lib");


var testPort = 30023;
var testUrl = 'http://localhost:' + testPort;

describe("Publishing several models", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person);
        modelAPI.expose(models.Book);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("OPTIONS /api/v1/people 200 -- get options for People API", function (done) {

    request.post({
      url: util.format('%s/api/v1/people', testUrl),
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

  it("OPTIONS /api/v1/books 200 -- get options for Books API", function (done) {

    request.post({
      url: util.format('%s/api/v1/books', testUrl),
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
