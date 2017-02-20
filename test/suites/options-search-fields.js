var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require("util");
var assert = require('assert');
require('../helpers/assert-include');

var app = require('../setup/app');
var db = require('../setup/db');
var models = require('../models');
var api = require("../../lib");

var testPort = 30023;
var testUrl = 'http://127.0.0.1:' + testPort;

describe("Restrictions for search by certain fields (HTTP POST)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          search: {
            path: 'search',
            method: 'post'
          },
          queryFields: {
            firstName: true
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


  it("Searching by the allowed field - should return one result)", function (done) {
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        firstName: "Taras"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 1);
      assert.equal(body[0].firstName, "Taras");
      assert.equal(body[0].lastName, "Shevchenko");
      assert.equal(body[0].email, "t.shevchenko@heroes.ua");
      done();
    });

  });

  it("Searching by the not allowed field - should ignore not allowed fields and return all the people", function (done) {
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        lastName: "Shevchenko"
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

describe("Restrictions for search by certain fields (HTTP GET)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          queryFields: {
            firstName: true
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


  it("Searching by the allowed field - should return one result)", function (done) {
    request.get({
      url: util.format('%s/api/v1/people/?firstName=Taras', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 1);
      assert.equal(body[0].firstName, "Taras");
      assert.equal(body[0].lastName, "Shevchenko");
      assert.equal(body[0].email, "t.shevchenko@heroes.ua");
      done();
    });

  });

  it("Searching by the not allowed field - should ignore not allowed fields and return all the people", function (done) {
    request.get({
      url: util.format('%s/api/v1/people/?lastName=Shevchenko', testUrl)
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
