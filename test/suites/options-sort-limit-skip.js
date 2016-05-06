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
var testUrl = 'http://localhost:' + testPort;

describe("Skip and limit allowed", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("Get all people without limitation", function (done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl),
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

  it("Get all people and limit the result with 2 reecords", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_limit=2', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      assert.equal(body.length, 2);
      done();
    });

  });

  it("Get all people, limit the result with 2 reecords and skip 1 record", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_limit=2&_skip=1&_sort=email', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      assert.equal(body.length, 2);
      models.Person.find().sort("email").skip(1).limit(2).exec(function (err, people){
        assert.ok(!err);
        assert.equal(people.length, 2);
        for(var i=0; i<people.length; i++) {
          assert.equal(people[i]._id, body[i]._id);
        };
        done();
      });

    });

  });

});

describe("Limitation disabled", function (done) {
  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          limit: false
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("Get all people and try limit the result with 2 reecords - should return 4 records", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_limit=2', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      assert.equal(body.length, 4);
      done();
    });

  });

  it("Get all people, try to limit the result with 2 reecords and skip 1 record - should return 3 records", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_limit=2&_skip=1&_sort=email', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      assert.equal(body.length, 3);
      models.Person.find().sort("email").skip(1).limit(2).exec(function (err, people){
        assert.ok(!err);
        assert.equal(people.length, 2);
        for(var i=0; i<2; i++) {
          assert.equal(people[i]._id, body[i]._id);
        };
        done();
      });

    });

  });

});

describe("Skipping disabled", function (done) {
  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          skip: false
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("Get all people, try to skip 1 record - should return 4 records", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_skip=1&_sort=email', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      assert.equal(body.length, 4);
      models.Person.find().sort("email").exec(function (err, people){
        assert.ok(!err);
        assert.equal(people.length, 4);
        for(var i=0; i<people.length; i++) {
          assert.equal(people[i]._id, body[i]._id);
        };
        done();
      });

    });

  });

});

describe("Sorting disabled", function (done) {

    beforeEach(function (done) {

      async.waterfall([
        app.init, db.init,
        db.fixtures.bind(null, {
          Person: '../fixtures/people'
        }),
        function (next) {
          var modelAPI = new api.ModelAPIExpress();
          modelAPI.expose(models.Person, {
            sort: false
          });
          app.use('/api/v1/', modelAPI);
          app.listen(testPort, next);
        }
      ], done);
    });

    afterEach(function (done) {
      async.waterfall([db.close, app.close], done)
    });

  it("Get all people, try to sort by email - should return unsorted list", function (done) {
    request.get({
      url: util.format('%s/api/v1/people?_sort=email', testUrl)
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
