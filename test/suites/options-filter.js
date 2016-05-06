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

describe("Restricting access to documents by filtering (exposing only Poets)", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          filter: {isPoet: true},
          create: {
            middlewares: function (req, res, next) {
              if (req.body.isPoet === false) {
                return next(new api.ModelAPIError(
                  422, 'The Person is not a poet'
                ));
              }
              return next();
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

  it("POST /api/v1/people 201 -- create a Poet", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua",
        isPoet: true
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

  it("POST /api/v1/people 422 -- create not a Poet", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua",
        isPoet: false
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      assert.equal(body.message, "The Person is not a poet");
      done();
    });
  });

  it("GET /api/v1/people 200 -- getting for people (only poets)", function (done){
    request.get({
      url: util.format('%s/api/v1/people', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 2);
      body.forEach(function(p) {
        assert.equal(p.isPoet, true);
      });
      done();
    });
  });

  it("GET /api/v1/people/:id 200 -- get a specific Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
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
        assert.ok(body.isPoet);
        done();
      });
    });
  });

  it("GET /api/v1/people/:id 404 -- get a specific not Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });


  it("POST /api/v1/people/:id 200 -- update a specific Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
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

  it("POST /api/v1/people/:id 404 -- update a specific not Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        json: {
          email: "new.mail@server.com"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

  it("DELETE /api/v1/people/:id 200 -- deleting a Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
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

  it("DELETE /api/v1/people/:id 404 -- deleting not a Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

});

describe("Restricting access to documents by dynamic filtering (exposing only Poets if requires in HTTP-header)", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {Reverse: 'get'},
          filter: function(req) {
            if (req.headers['x-poet-control'] === 'YES') {
              return {isPoet: true}
            }
            return {};
          },
          create: {
            middlewares: function (req, res, next) {
              if (req.body.isPoet === false && req.headers['x-poet-control'] === 'YES') {
                return next(new api.ModelAPIError(
                  422, 'The Person is not a poet'
                ));
              }
              return next();
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

  it("POST /api/v1/people 201 -- create a Poet", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "x-poet-control": "YES"
      },
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua",
        isPoet: true
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

  it("POST /api/v1/people 422 -- create not a Poet", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "x-poet-control": "YES"
      },
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua",
        isPoet: false
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      assert.equal(body.message, "The Person is not a poet");
      done();
    });
  });

  it("POST /api/v1/people 200 -- create not a Poet (poet control off)", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "x-poet-control": "NO"
      },
      json: {
        firstName: 'John',
        lastName: 'Johnson',
        email: "john.johnson@i.ua",
        isPoet: false
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      done();
    });
  });

  it("GET /api/v1/people 200 -- getting for people (only poets)", function (done){
    request.get({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "x-poet-control": "YES"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 2);
      body.forEach(function(p) {
        assert.equal(p.isPoet, true);
      });
      done();
    });
  });


  it("GET /api/v1/people 200 -- getting for people (poet control off)", function (done){
    request.get({
      url: util.format('%s/api/v1/people', testUrl),
      headers: {
        "x-poet-control": "NO"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      };
      var isPoet = false;
      var isNotPoet = false;
      assert.equal(body.length, 4);
      body.forEach(function(p) {
        isPoet = isPoet || p.isPoet;
        isNotPoet = isNotPoet || (p.isPoet === false);
      });
      assert.ok(isPoet);
      assert.ok(isNotPoet);
      done();
    });
  });

  it("GET /api/v1/people/:id 200 -- get a specific Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "YES"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.firstName, p.firstName);
        assert.equal(body.lastName, p.lastName);
        assert.equal(body.email, p.email.toLowerCase());
        assert.ok(body.isPoet);
        done();
      });
    });
  });

  it("GET /api/v1/people/:id/reverse 200 -- calling instance method of a specific Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id),
        headers: {
          "x-poet-control": "YES"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.status, "Ok");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1.firstName, p.firstName.split("").reverse().join(""));
          assert.equal(p1.lastName, p.lastName.split("").reverse().join(""));
          done();
        });
      });
    });
  });

  it("GET /api/v1/people/:id 404 -- get a specific not Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "YES"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });


  it("GET /api/v1/people/:id 200 -- get a specific not Poet (poet control off)", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p);
      assert.ok(p._id);
      request.get({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "NO"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        done();
      });
    });
  });

  it("POST /api/v1/people/:id 200 -- update a specific Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "YES"
        },
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

  it("POST /api/v1/people/:id 404 -- update a specific not Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "YES"
        },
        json: {
          email: "new.mail@server.com"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

  it("POST /api/v1/people/:id 200 -- update a specific not Poet (poet control off)", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "x-poet-control": "NO"
        },
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

  it("DELETE /api/v1/people/:id 200 -- deleting a Poet", function(done) {
    models.Person.findOne({isPoet: true}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE",
          "x-poet-control": "YES"
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

  it("DELETE /api/v1/people/:id 404 -- deleting not a Poet", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE",
          "x-poet-control": "YES"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 404);
        done();
      });
    });
  });

  it("DELETE /api/v1/people/:id 200 -- deleting not a Poet (poet control off)", function(done) {
    models.Person.findOne({isPoet: false}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      request.post({
        url: util.format('%s/api/v1/people/%s', testUrl, p._id),
        headers: {
          "X-HTTP-Method-Override": "DELETE",
          "x-poet-control": "NO"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        done();
      });
    });
  });

});
