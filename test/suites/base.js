'use strict';

const async = require('async');
const mongoose = require('mongoose');
const request = require("request");
const util = require("util");
const assert = require('assert');

const app = require('../setup/app');
const db = require('../setup/db');
const models = require('../models');
const api = require("../../lib");


const testPort = 30023;
const testUrl = 'http://127.0.0.1:' + testPort;

describe("Simplest API use. Rest Full", function (done) {

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
      assert.equal(body.length, 7);
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
      assert.equal(body.length, 6);
      done();
    });

  });

  it("POST /api/v1/people 201 -- create a Person", function (done){
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
      assert.ok(body._id);
      assert.equal(body.firstName, 'John');
      assert.equal(body.lastName, 'Johnson');
      assert.equal(body.email, "john.johnson@i.ua");
      models.Person.count(function(err, res) {
        assert.equal(res, 5);
        done();
      });
    });
  });

  it("POST /api/v1/people 422 -- posting invalid data while creating a Person", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        email: "john.johnson@i.ua"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      assert.equal(body.message, "Person validation failed");
      done();
    });
  });

  it("GET /api/v1/people 200 -- searching for a person by mail (no results)", function (done){
    request.get({
      url: util.format('%s/api/v1/people?email=john.johnson@i.ua', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 0);
      done();
    });
  });

  it("GET /api/v1/people 200 -- searching for a person by mail (one result)", function (done){
    request.get({
      url: util.format('%s/api/v1/people?email=a.s.pushkin@authors.ru', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.equal(body[0].firstName, "Alexander");
      assert.equal(body[0].lastName, "Pushkin");
      done();
    });
  });

  it("GET /api/v1/people 200 -- searching for people (many results)", function (done){
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

  it("POST /api/v1/people/search 405 -- try to search via POST-method", function (done){
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        firstName: {$ne: "Alexander"}
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      assert.equal(body.error, true);
      assert.equal(body.message, "Not Supported");
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
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.firstName, p.firstName);
        assert.equal(body.lastName, p.lastName);
        assert.equal(body.email, "new.mail@server.com");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1.firstName, p.firstName);
          assert.equal(p1.lastName, p.lastName);
          assert.equal(p1.email, "new.mail@server.com");
          done();
        });
      });
    });
  });

  it("POST /api/v1/people/:id 422 -- trying to update the specific Person with invalid data", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        json: {
          lastName: "",
          email: null
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 422);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.error, true);
        assert.equal(body.message, "Validation failed");
        assert.equal(body.errors.email.message, 'Path `email` is required.');
        assert.equal(body.errors.lastName.message, 'Path `lastName` is required.');
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
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.deepEqual(body, {});
        models.Person.count(function(err, res) {
          assert.equal(res, 3);
          done();
        });
      });
    });
  });

  it("GET /api/v1/people/:id 404 -- try to get Person by unexisting id", function(done) {
    var id = mongoose.Types.ObjectId();
    request.get({
      url: util.format('%s/api/v1/people/%s', testUrl, id)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.error, true);
      assert.equal(body.message, "The Person was not found by "+id);
      done();
    });
  });

  it("POST /api/v1/people/:id 404 -- try to update Person by unexisting id", function(done) {
    var id = mongoose.Types.ObjectId();
    request.post({
      url: util.format('%s/api/v1/people/%s', testUrl, id),
      json: {
        email: "new.mail@server.com"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.error, true);
      assert.equal(body.message, "The Person was not found by "+id);
      done();
    });
  });

  it("DELETE /api/v1/people/:id 404 -- try to delete Person by unexisting id", function(done) {
    var id = mongoose.Types.ObjectId();
    request.post({
      url: util.format('%s/api/v1/people/%s', testUrl, id),
      headers: {
        "X-HTTP-Method-Override": "DELETE"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.error, true);
      assert.equal(body.message, "The Person was not found by "+id);
      done();
    });
  });

  it("POST /api/v1/people/count 405 -- trying to call not implemented method", function (done){
    request.post({
      url: util.format('%s/api/v1/people/count', testUrl),
    }, function (err, res, body) {

      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.error, true);
      assert.equal(body.message, "Not Supported");
      done();
    });
  });
});

describe("Searching by POST-method", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        var apiRouter = new api.ModelAPIRouter('Person', {
          search: {
            method: 'post',
            path: 'search'
          }
        });
        assert.deepEqual(apiRouter.urls(), []);
        apiRouter.attachTo(modelAPI);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);

  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("POST /api/v1/people/search 200 -- searching for a person by mail (one result)", function (done){
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        "email": "a.s.pushkin@authors.ru"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.equal(body[0].firstName, "Alexander");
      assert.equal(body[0].lastName, "Pushkin");
      done();
    });
  });

  it("POST /api/v1/people/search 200 -- searching for a person by firstName (many results)", function (done){
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        "firstName": {$ne: "Alexander"}
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 3);
      body.forEach(function(p) {
        assert.notEqual(p.firstName, "Alexander");
      });
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

});

describe("Searching by PUT-method", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          search: 'put'
        });
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
      const searhByPut = body.find(b => (
        b[0] == "put" &&
        b[1] == "/api/v1/people/" &&
        b[2] == "List/Search all people"
      ));
      assert.ok(searhByPut);
      done();
    });

  });


  it("PUT /api/v1/people 200 -- searching for a person by mail (one result)", function (done){
    request.put({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        "email": "a.s.pushkin@authors.ru"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.equal(body[0].firstName, "Alexander");
      assert.equal(body[0].lastName, "Pushkin");
      done();
    });
  });

  it("PUT /api/v1/people 200 -- searching for a person by firstName (many results)", function (done){
    request.put({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        "firstName": {$ne: "Alexander"}
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 3);
      body.forEach(function(p) {
        assert.notEqual(p.firstName, "Alexander");
      });
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

});
