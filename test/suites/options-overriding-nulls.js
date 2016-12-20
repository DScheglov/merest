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
var testUrl = 'http://127.0.0.1:' + testPort;

var people = require('../fixtures/people');

describe("Options overriding", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {
          fields: 'title year',
          details: {
            fields: null
          }
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("GET /api/v1/books 200 -- should return title year and _id", function (done) {

    request.get({
      url: util.format('%s/api/v1/books', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.length);
      body.forEach(
        b => assert.deepEqual(Object.keys(b).sort(), ['_id', 'title', 'year'])
      );
      done();
    });

  });

  it("GET /api/v1/books/:id 200 -- should return all fields", function (done) {

    request.get({
      url: util.format('%s/api/v1/books/564e0da0105badc887ef1c42', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.deepEqual(
        Object.keys(body).sort(),
        [ '_id', 'author', 'description', 'title', 'year' ]
      );

      done();
    });

  });

});
