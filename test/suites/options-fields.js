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

describe("Common fields restrictios for list and instance", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
				  fields: {
					  _id: false,
					  firstName: true,
					  email: true
				  }
			  });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("Get all people and check fields", function (done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      var i = body.length;
      var keys;
      assert.equal(i, 4);
      while (i--) {
        keys = Object.keys(body[i]);
        assert.equal(keys.length, 2);
        assert.include(keys, "firstName");
        assert.include(keys, "email");
      }
      done();
    });

  });

  it("Get a specific Person and check fields", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.firstName, p.firstName);
        assert.equal(body.email, p.email.toLowerCase());
        var keys = Object.keys(body);
        assert.equal(keys.length, 2);
        assert.include(keys, "firstName");
        assert.include(keys, "email");
        done();
      });
    });
  });

});

describe("Separate fields restrictios for list and instance", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          fields: {
            _id: false,
            firstName: true,
            email: true
          },
          search: {
            fields: {
              lastName: true
            }
          }
			  });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("Get all people and check fields", function (done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl),
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      var i = body.length;
      var keys;
      assert.equal(i, 4);
      while (i--) {
        keys = Object.keys(body[i]);
        assert.equal(keys.length, 2);
        assert.include(keys, "_id");
        assert.include(keys, "lastName");
      }
      done();
    });

  });

  it("Get a specific Person and check fields", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.firstName, p.firstName);
        assert.equal(body.email, p.email.toLowerCase());
        var keys = Object.keys(body);
        assert.equal(keys.length, 2);
        assert.include(keys, "firstName");
        assert.include(keys, "email");
        done();
      });
    });
  });

});
