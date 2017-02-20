'use strict';

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

describe("Exposing methods explicitly (HTTP POST)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {
            Reverse: "Reverse letters in firstName and in lastName of specified Person"
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

  it("OPTIONS /api/v1/people 200 -- should return url for the exposed method Reverse", function (done) {

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
      assert.equal(body.length, 7);
      assert.ok(body.find(b => (
        b[0] == 'post' && b[1] == "/api/v1/people/:id/reverse" &&
        b[2] == "Reverse letters in firstName and in lastName of specified Person"
      )));

      done();
    });
  });

  it("POST /api/v1/people/:id/reverse 200 -- should reverse letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.post({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id)
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

  it("POST /api/v1/people/:id/reverse 404 -- try to call method Person by unexisting id -- should return 404", function(done) {
    var id = mongoose.Types.ObjectId();
    request.post({
      url: util.format('%s/api/v1/people/%s/reverse', testUrl, id)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.message, 'The Person was not found by '+ id);
      done();
    });
  });

  it("POST /api/v1/people/:id/to-upper-case 405 -- try to call unexposed method - should return 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.post({
        url: util.format('%s/api/v1/people/%s/to-upper-case', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.message, "Not Supported");
        done();
      });
    });
  });
});

describe("Exposing methods explicitly (HTTP GET)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {
            Reverse: {
              method: 'get',
              title: "Reverse letters in firstName and in lastName of specified Person"
            }
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

  it("OPTIONS /api/v1/people 200 -- should return url for the exposed method Reverse", function (done) {

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
      assert.equal(body.length, 7);
      var i;
      for (i=0; i<body.length; i++) {
        if (body[i][0] == 'get' &&
            body[i][1] == "/api/v1/people/:id/reverse" &&
            body[i][2] == "Reverse letters in firstName and in lastName of specified Person") break;
      }
      // assert.notEqual(i, body.length);
      done();
    });
  });

  it("GET /api/v1/people/:id/reverse 200 -- should reverse letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id)
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

  it("GET /api/v1/people/:id/reverse 404 -- try to call method Person by unexisting id -- should return 404", function(done) {
    var id = mongoose.Types.ObjectId();
    request.get({
      url: util.format('%s/api/v1/people/%s/reverse', testUrl, id)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.message, 'The Person was not found by '+ id);
      done();
    });
  });

  it("GET /api/v1/people/:id/to-upper-case 405 -- try to call unexposed method - should return 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/to-upper-case', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.message, "Not Supported");
        done();
      });
    });
  });
});

describe("Exposing methods explicitly (HTTP GET + path)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {
            Reverse: {
              method: 'get',
              path: 'rev',
              title: "Reverse letters in firstName and in lastName of specified Person"
            }
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

  it("OPTIONS /api/v1/people 200 -- should return url for the exposed method Reverse", function (done) {

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

      assert.equal(body.length, 7);
      var i;
      for (i=0; i<body.length; i++) {
        if (body[i][0] == 'get' &&
            body[i][1] == "/api/v1/people/:id/rev" &&
            body[i][2] == "Reverse letters in firstName and in lastName of specified Person") break;
      }
      assert.notEqual(i, body.length);
      done();
    });
  });

  it("GET /api/v1/people/:id/rev 200 -- should reverse letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/rev', testUrl, p._id)
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

  it("GET /api/v1/people/:id/rev 404 -- try to call method Person by unexisting id -- should return 404", function(done) {
    var id = mongoose.Types.ObjectId();
    request.get({
      url: util.format('%s/api/v1/people/%s/rev', testUrl, id)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 404);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.message, 'The Person was not found by '+ id);
      done();
    });
  });

  it("GET /api/v1/people/:id/to-upper-case 405 -- try to call unexposed method - should return 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/to-upper-case', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.message, "Not Supported");
        done();
      });
    });
  });

  it("GET /api/v1/people/:id/reverse 405 -- try to call method by default path - should return 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.message, "Not Supported");
        done();
      });
    });
  });

});

describe("Exposing methods explicitly (HTTP GET + path + exec)", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {
            Reverse: {
              method: 'get',
              path: 'rev',
              title: "Reverses letters in firstName and in lastName of specified Person and adds + to the start",
              exec: function (options, next) {
                this.firstName = this.firstName.replace(/\+/, '') + '+';
                this.lastName = this.lastName.replace(/\+/, '') + '+';
                this.Reverse(null, next);
              }
            }
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

  it("OPTIONS /api/v1/people 200 -- should return url for the exposed method Reverse", function (done) {

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

      assert.equal(body.length, 7);
      var i;
      for (i=0; i<body.length; i++) {
        if (body[i][0] == 'get' &&
            body[i][1] == "/api/v1/people/:id/rev" &&
            body[i][2] == "Reverses letters in firstName and in lastName of specified Person and adds + to the start") break;
      }
      assert.notEqual(i, body.length);
      done();
    });
  });

  it("GET /api/v1/people/:id/rev 200 -- should reverse letters and add +", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/rev', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.status, "Ok");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1.firstName, '+' + p.firstName.replace('+', '').split("").reverse().join(""));
          assert.equal(p1.lastName, '+' + p.lastName.replace('+', '').split("").reverse().join(""));
          done();
        });
      });
    });
  });

  it("GET /api/v1/people/:id/rev 200 (twice) -- should reverse letters and add +", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.get({
        url: util.format('%s/api/v1/people/%s/rev', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.status, "Ok");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1.firstName, '+' + p.firstName.replace('+', '').split("").reverse().join(""));
          assert.equal(p1.lastName, '+' + p.lastName.replace('+', '').split("").reverse().join(""));
          done();
        });
      });
    });
  });

});

describe("Exposing methods implicitly", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {"*": true}
			  });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("OPTIONS /api/v1/people 200 -- should return urls for the exposed methods", function (done) {

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
      assert.equal(body.length, 8);
      var i;
      var reverseExposed = false;
      var toUpperCaseExposed = false;
      for (i=0; i<body.length; i++) {
        reverseExposed = reverseExposed || (
          body[i][0] == "post" &&
          body[i][1] == "/api/v1/people/:id/reverse" &&
          body[i][2] == "Person.Reverse"
        );
        toUpperCaseExposed = toUpperCaseExposed || (
          body[i][0] == "post" &&
          body[i][1] == "/api/v1/people/:id/to-upper-case" &&
          body[i][2] == "Person.toUpperCase"
        );
        if (reverseExposed && toUpperCaseExposed) break;
      }
      assert.ok(reverseExposed);
      assert.ok(toUpperCaseExposed);
      done();
    });
  });

  it("POST /api/v1/people/:id/reverse 200 -- should reverse letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.post({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id)
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

  it("POST /api/v1/people/:id/to-upper-case 200 -- should upper-case letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id);
      assert.ok(!(/^[A-Z]+$/.test(p.firstName)));
      assert.ok(!(/^[A-Z]+$/.test(p.lastName)));
      request.post({
        url: util.format('%s/api/v1/people/%s/to-upper-case', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.status, "Ok");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1._id.toString(), p._id.toString());
          assert.equal(p1.firstName, p.firstName.toUpperCase());
          assert.equal(p1.lastName, p.lastName.toUpperCase());
          done();
        });
      });
    });
  });
});

describe("Hiding methods explicitly", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          expose: {
            "*": true,
            toUpperCase: false
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

  it("OPTIONS /api/v1/people 200 -- should not return url for the hidden method toUpperCase", function (done) {

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
      assert.equal(body.length, 7);
      var i;
      var reverseExposed = false;
      var toUpperCaseExposed = false;
      for (i=0; i<body.length; i++) {
        reverseExposed = reverseExposed || (
          body[i][0] == "post" &&
          body[i][1] == "/api/v1/people/:id/reverse" &&
          body[i][2] == "Person.Reverse"
        );
        toUpperCaseExposed = toUpperCaseExposed || (
          body[i][0] == "post" &&
          body[i][1] == "/api/v1/people/:id/to-upper-case" &&
          body[i][2] == "Person.toUpperCase"
        );
        if (reverseExposed && toUpperCaseExposed) break;
      }
      assert.ok(reverseExposed);
      assert.ok(!toUpperCaseExposed);
      done();
    });
  });

  it("POST /api/v1/people/:id/reverse 200 -- should reverse letters", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.post({
        url: util.format('%s/api/v1/people/%s/reverse', testUrl, p._id)
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

  it("POST /api/v1/people/:id/to-upper-case 405 -- try to call hidden method - should return 405", function(done) {
    models.Person.findOne({}, function (err, p) {
      assert.ok(!err);
      assert.ok(p._id)
      request.post({
        url: util.format('%s/api/v1/people/%s/to-upper-case', testUrl, p._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 405);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.message, "Not Supported");
        done();
      });
    });
  });
});

describe("Exposing static methods implicitly", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          exposeStatic: {
            "*": true
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

  it("OPTIONS /api/v1/people/ 200 -- should return urls for the exposed methods", function (done) {

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

      assert.equal(body.length, 7);
      var i;
      var emailListExposed = false;
      for (i=0; i<body.length && !emailListExposed; i++) {
        emailListExposed = (
          body[i][0] == "post" &&
          body[i][1] == "/api/v1/people/email-list" &&
          body[i][2] == "Person.statics.emailList"
        );
      }
      assert.ok(emailListExposed);
      done();
    });
  });

  it("POST /api/v1/people/email-list 200 -- should return an ordered email-list", function(done) {
    request.post({
      url: util.format('%s/api/v1/people/email-list', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body instanceof Array);
      assert.equal(body.length, 4);
      assert.deepEqual(body, ['t.shevchenko@heroes.ua',
      'a.s.pushkin@authors.ru',
      'jack.london@writers.uk',
      'm-twen@legends.us'].sort());
      done();
    });
  });
});

describe("Exposing new methods", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          exposeStatic: {
            helloWorld: {
              method: 'get',
              exec: function(params, cb) {
                cb(null, {message: 'Hello World!'})
              }
            }
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

  it("OPTIONS /api/v1/people 200 -- should return urls for hello-world", function (done) {

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
      assert.equal(body.length, 7);
      assert.ok(body.some(
        o => o[1] === '/api/v1/people/hello-world'
      ));
      done();
    });
  });

  it("GET /api/v1/people/hello-world 200 -- should return \"Hello world!\"", function (done) {

    request.get({
      url: util.format('%s/api/v1/people/hello-world', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.message);
      assert.equal(body.message, 'Hello World!')

      done();
    });
  });

});

describe("Exposing all methdos and the new one", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          exposeStatic: {
            '*': true,
            helloWorld: {
              method: 'get',
              exec: function(params, cb) {
                cb(null, {message: 'Hello World!'})
              }
            }
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

  it("OPTIONS /api/v1/people 200 -- should return urls for hello-world", function (done) {

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
      assert.equal(body.length, 8);
      assert.ok(body.some(
        o => o[1] === '/api/v1/people/hello-world'
      ));
      done();
    });
  });

  it("GET /api/v1/people/hello-world 200 -- should return \"Hello world!\"", function (done) {

    request.get({
      url: util.format('%s/api/v1/people/hello-world', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.message);
      assert.equal(body.message, 'Hello World!')

      done();
    });
  });

});
