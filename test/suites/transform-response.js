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

function meta() {

  var newBody = {
    meta: {
      status: this.status,
      operation: this.apiMethod
    }
  };

  if (this.apiStaticMethod) {
    newBody.meta.staticMethod = this.apiStaticMethod;
  };

  if (this.apiInstanceMethod) {
    newBody.meta.instanceMethod = this.apiInstanceMethod;
  };

  if (this.modelAPI) {
    newBody.meta.model = this.modelAPI.model.modelName;
  };

  if (this.status >= 300) {
    newBody.meta.error = true;
    newBody.meta.message = this.body.message;
    newBody.errors = this.body.errors || [this.body];
  } else {
    newBody.data = this.body;
    if (util.isArray(this.body)) {
      newBody.meta.isArray = true;
      newBody.meta.count = this.body.length;
    };
  };

  this.status = this.status >= 300 ? 200 : this.status;
  this.body = newBody;
}

describe("Response transformation", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress({transformResponse: meta});
        modelAPI.expose(models.Person, {
          expose: {'*': true},
          exposeStatic: {'*': true}
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("OPTIONS /api/v1 200 -- should respond with meta data", function (done) {
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
      assert.ok(body.meta);
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.operation, 'options');
      assert.ok(!body.meta.model);
      assert.equal(body.meta.isArray, true);
      assert.equal(body.meta.count, 10);
      assert.ok(body.data);
      assert.equal(body.data.length, 10);
      done();
    });

  });

  it("OPTIONS /api/v1/people 200 -- should respond with meta data", function (done) {

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
      assert.ok(body.meta);
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.operation, 'options');
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.isArray, true);
      assert.equal(body.meta.count, 9);
      assert.ok(body.data);
      assert.equal(body.data.length, 9);
      done();
    });

  });

  it("POST /api/v1/people 201 -- should respond with meta data", function (done){
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
      assert.ok(body.meta);
      assert.equal(body.meta.status, 201);
      assert.equal(body.meta.operation, 'create');
      assert.equal(body.meta.model, 'Person');
      assert.ok(!body.meta.isArray);
      assert.ok(!body.meta.count);
      assert.ok(body.data);
      assert.ok(body.data._id);
      assert.equal(body.data.firstName, 'John');
      assert.equal(body.data.lastName, 'Johnson');
      assert.equal(body.data.email, "john.johnson@i.ua");
      models.Person.count(function(err, res) {
        assert.equal(res, 5);
        done();
      });
    });
  });

  it("POST /api/v1/people 422 -- should respond with meta data", function (done){
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        firstName: 'John',
        email: "john.johnson@i.ua"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      assert.ok(body.meta);
      assert.equal(body.meta.status, 422);
      assert.equal(body.meta.operation, 'create');
      assert.equal(body.meta.model, 'Person');
      assert.ok(body.errors);
      assert.equal(body.meta.message, "Person validation failed");
      done();
    });
  });

  it("GET /api/v1/people 200 -- should respond with meta data", function (done){
    request.get({
      url: util.format('%s/api/v1/people?email=john.johnson@i.ua', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.meta);
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.operation, 'search');
      assert.ok(body.meta.isArray);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.count, 0);
      assert.equal(body.data.length, 0);
      done();
    });
  });

  it("GET /api/v1/people 200 -- should respond with meta data", function (done){
    request.get({
      url: util.format('%s/api/v1/people?email=a.s.pushkin@authors.ru', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }

      assert.ok(body.meta);
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.operation, 'search');
      assert.ok(body.meta.isArray);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.count, 1);
      assert.equal(body.data.length, 1);

      assert.equal(body.data[0].firstName, "Alexander");
      assert.equal(body.data[0].lastName, "Pushkin");
      done();
    });
  });

  it("GET /api/v1/people 200 -- should respond with meta data", function (done){
    request.get({
      url: util.format('%s/api/v1/people', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.operation, 'search');
      assert.ok(body.meta.isArray);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.count, 4);
      assert.equal(body.data.length, 4);
      done();
    });
  });

  it("POST /api/v1/people/search 405 -- should respond with meta data", function (done){
    request.post({
      url: util.format('%s/api/v1/people/search', testUrl),
      json: {
        firstName: {$ne: "Alexander"}
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      assert.ok(body.meta);
      assert.equal(body.meta.status, 405);
      assert.ok(!body.meta.operation);
      assert.equal(body.meta.model, 'Person');
      assert.ok(body.errors);
      assert.equal(body.meta.message, "Not Supported");
      done();
    });
  });

  it("GET /api/v1/people/:id 200 -- should respond with meta data", function(done) {
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
        assert.ok(body.meta);
        assert.equal(body.meta.status, 200);
        assert.equal(body.meta.operation, 'details');
        assert.equal(body.meta.model, 'Person');
        assert.ok(!body.meta.isArray);
        assert.equal(body.data.firstName, p.firstName);
        assert.equal(body.data.lastName, p.lastName);
        assert.equal(body.data.email, p.email.toLowerCase());
        done();
      });
    });
  });

  it("POST /api/v1/people/:id 200 -- should responde with meta data", function(done) {
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
        assert.ok(body.meta);
        assert.equal(body.meta.status, 200);
        assert.equal(body.meta.model, 'Person');
        assert.equal(body.meta.operation, 'update');
        assert.ok(!body.meta.isArray);
        assert.equal(body.data.firstName, p.firstName);
        assert.equal(body.data.lastName, p.lastName);
        assert.equal(body.data.email, "new.mail@server.com");
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

  it("POST /api/v1/people/:id 422 -- should respond with meta data", function(done) {
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
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.ok(body.meta);
        assert.equal(body.meta.status, 422);
        assert.equal(body.meta.model, 'Person');
        assert.equal(body.meta.operation, 'update');
        assert.ok(body.errors);
        assert.equal(body.meta.message, "Validation failed");
        assert.equal(body.errors.email.message, 'Path `email` is required.');
        assert.equal(body.errors.lastName.message, 'Path `lastName` is required.');
        done();
      });
    });
  });

  it("DELETE /api/v1/people/:id 200 -- should respond with meta data", function(done) {
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
        assert.ok(body.meta);
        assert.equal(body.meta.status, 200);
        assert.equal(body.meta.model, 'Person');
        assert.equal(body.meta.operation, 'delete');
        assert.ok(!body.meta.isArray);
        assert.deepEqual(body.data, {});
        models.Person.count(function(err, res) {
          assert.equal(res, 3);
          done();
        });
      });
    });
  });

  it("GET /api/v1/people/:id 404 -- should responde with meta data", function(done) {
    var id = mongoose.Types.ObjectId();
    request.get({
      url: util.format('%s/api/v1/people/%s', testUrl, id)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.meta);
      assert.equal(body.meta.status, 404);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.operation, 'details');
      assert.ok(body.errors);
      assert.equal(body.meta.message, "The Person was not found by "+id);
      done();
    });
  });

  it("POST /api/v1/people/:id 404 -- should respond with meta data", function(done) {
    var id = mongoose.Types.ObjectId();
    request.post({
      url: util.format('%s/api/v1/people/%s', testUrl, id),
      json: {
        email: "new.mail@server.com"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.meta);
      assert.equal(body.meta.status, 404);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.operation, 'update');
      assert.ok(body.errors);
      assert.equal(body.meta.message, "The Person was not found by "+id);
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
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.meta);
      assert.equal(body.meta.status, 404);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.operation, 'delete');
      assert.ok(body.errors);
      assert.equal(body.meta.message, "The Person was not found by "+id);
      done();
    });
  });

  it("POST /api/v1/people/:id/reverse 200 -- should respond with meta data", function(done) {
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
        assert.ok(body.meta);
        assert.equal(body.meta.status, 200);
        assert.equal(body.meta.model, 'Person');
        assert.equal(body.meta.operation, 'instanceMethod');
        assert.equal(body.meta.instanceMethod, 'Reverse');
        assert.equal(body.data.status, "Ok");
        models.Person.findById(p._id, function (err, p1) {
          assert.ok(!err);
          assert.equal(p1.firstName, p.firstName.split("").reverse().join(""));
          assert.equal(p1.lastName, p.lastName.split("").reverse().join(""));
          done();
        });
      });
    });
  });

  it("POST /api/v1/people/email-list 200 -- should respond with meta data", function(done) {
    request.post({
      url: util.format('%s/api/v1/people/email-list', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.meta.status, 200);
      assert.equal(body.meta.model, 'Person');
      assert.equal(body.meta.operation, 'staticMethod');
      assert.equal(body.meta.staticMethod, 'emailList');
      assert.equal(body.meta.isArray, true);
      assert.equal(body.meta.count, 4);
      assert.equal(body.data.length, 4);
      assert.deepEqual(body.data, [
        'a.s.pushkin@authors.ru',
        'jack.london@writers.uk',
        'm-twen@legends.us',
        't.shevchenko@heroes.ua'
      ]);
      done();
    });
  });

});


describe("Wrong value of transformResponse parameter", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress({
          transformResponse: 'not a function'}
        );
        var apiRouter = new api.ModelAPIRouter(models.Person);
        apiRouter.attachTo(modelAPI);
        apiRouter.attachTo(modelAPI);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("OPTIONS /api/v1 200 -- should respond without meta data", function (done) {
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
      assert.ok(!body.meta);
      assert.equal(body.length, 7);
      done();
    });

  });

});
