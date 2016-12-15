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

describe("REST-method restrictios -- readonly", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          options: true,
          create: false,
          search: true,
          details: true,
          update: false,
          delete: false
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("OPTIONS /api/v1 200 -- get options for all API", function (done) {
    request.post({
      url: util.format('%s/api/v1', testUrl),
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
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
      assert.equal(body.length, 3);
      done();
    });

  });

  it("POST /api/v1/people 405 -- trying to create a Person -- should receive 'Not Supported'", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(body.message, 'Not Supported');
      done();
    });
  });

  it("GET /api/v1/people 200 -- get all people", function(done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl)
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

  it("GET /api/v1/people/:id 200 -- get a specific Person", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.firstName, p.firstName);
        assert.equal(body.lastName, p.lastName);
        assert.equal(body.email, p.email.toLowerCase());
        done();
      });
    });
  });

  it("POST /api/v1/people/:id 405 -- update a specific Person -- should receive 'Not Supported'", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        json: {
          email: "new.mail@server.com"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.ok(body.error);
        assert.equal(body.message, 'Not Supported');
        done();
      });
    });
  });

  it("DELETE /api/v1/people/:id 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.ok(body.error);
        assert.equal(body.message, 'Not Supported');
        done();
      });
    });
  });

});

describe("REST-method restrictios -- write only", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress({options: false});
        modelAPI.expose(models.Person, {
          options: false,
          create: true,
          search: false,
          details: false,
          update: true,
          delete: true
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("OPTIONS /api/v1 200 -- get options for all API", function (done) {
    request.post({
      url: util.format('%s/api/v1', testUrl),
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(body.message, 'Not Supported');
      done();
    });

  });

  it("OPTIONS /api/v1/people 405 -- get options for People API", function (done) {

    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(body.message, 'Not Supported');
      done();
    });

  });

  it("POST /api/v1/people 201 -- trying to create a Person", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      done();
    });
  });

  it("GET /api/v1/people 405 -- get all people", function(done) {
    request.get({
      url: util.format('%s/api/v1/people', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(body.message, 'Not Supported');
      done();
    });
  });

  it("GET /api/v1/people/:id 405 -- get a specific Person", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.ok(body.error);
        assert.equal(body.message, 'Not Supported');
        done();
      });
    });
  });

  it("POST /api/v1/people/:id 200 -- update a specific Person", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        json: {
          email: "new.mail@server.com"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        done();
      });
    });
  });

  it("DELETE /api/v1/people/:id 200", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        done();
      });
    });
  });

});
