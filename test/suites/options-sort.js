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

describe("Restrictions for sorting by certain fields", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          sort: {
            email: true
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

  it("Should return results ordered by email (allowed for sorting) ascending", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_sort=email', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 4);
      for (var i=1;i<body.length;i++) {
        assert.ok(body[i].email >= body[i-1].email);
      }
      done();
    });

  });

  it("Should return results ordered by email (allowed for sorting) descending", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_sort=-email', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 4);
      for (var i=1;i<body.length;i++) {
        assert.ok(body[i].email <= body[i-1].email);
      }
      done();
    });

  });

  it("Should return unsorted results while trying to sort by not allowed for sorting field", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_sort=-lastName', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 4);
      var asc = false;
      var desc = false;
      for (var i=1;i<body.length;i++) {
        asc = asc || (body[i].lastName > body[i-1].lastName);
        desc = desc || (body[i].lastName < body[i-1].lastName);
      }
      assert.ok(asc);
      assert.ok(desc);
      done();
    });

  });

  it("Should return unsorted results while sort options is not specified", function (done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 4);
      var asc = false;
      var desc = false;
      for (var i=1;i<body.length;i++) {
        asc = asc || (body[i].email > body[i-1].email);
        desc = desc || (body[i].email < body[i-1].email);
      }
      assert.ok(asc);
      assert.ok(desc);
      done();
    });

  });

});

describe("Sorting, limiting and skiping with get method", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          sort: {
            email: true
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

  it("Should return results ordered by email (allowed for sorting) ascending", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_sort=email&firstName=Taras', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) === "string") {
        body = JSON.parse(body);
      }

      assert.equal(body.length, 1);
      done();
    });

  });

});
