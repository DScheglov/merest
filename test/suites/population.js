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

describe("Population -- simplest", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: people,
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {populate: 'author'});
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("OPTIONS /api/v1/books 200 -- get options for Books API", function (done) {

    request.post({
      url: util.format('%s/api/v1/books', testUrl),
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

  it("GET /api/v1/people/:id 200 -- get a specific Book (with populated author)", function(done) {
    models.Book.findOne({}, function (err, b) {
      assert.ok(!err);
      assert.ok(b);
      assert.ok(b._id);
      request.get({
        url: util.format('%s/api/v1/books/%s', testUrl, b._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.title, b.title);
        assert.equal(body.year, b.year);
        assert.ok(body.author);
        assert.ok(body.author instanceof Array);
        assert.ok(body.author.length);
        assert.ok(body.author[0]._id);
        assert.ok(body.author[0].firstName);
        assert.ok(body.author[0].lastName);
        assert.equal(body.author[0]._id, b.author[0]);
        done();
      });
    });
  });

  it("GET /api/v1/people/:id 200 -- get all Books (with populated author)", function(done) {

    request.get({
      url: util.format('%s/api/v1/books', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 16);
      body.forEach(function(book) {
        assert.ok(book.author instanceof Array);
        assert.ok(book.author.length);
        assert.ok(book.author[0]._id);
        assert.ok(book.author[0].firstName);
        assert.ok(book.author[0].lastName);
      });
      done();
    });
  });

  it("POST /api/v1/people/:id 200 -- create a new Book (with populated author)", function(done) {
    request.post({
      url: util.format('%s/api/v1/books', testUrl),
      json: {
        title: 'New book',
        year: 2000,
        description: 'The description',
        author: people[0]._id
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.title, 'New book');
      assert.equal(body.year, 2000);
      assert.equal(body.description, 'The description');
      assert.ok(body.author);
      assert.ok(body.author instanceof Array);
      assert.ok(body.author.length);
      assert.ok(body.author[0]._id);
      assert.ok(body.author[0].firstName);
      assert.ok(body.author[0].lastName);
      assert.equal(body.author[0]._id, people[0]._id);
      done();
    });
  });

  it("POST /api/v1/people/:id 200 -- update a specific Book (with populated author)", function(done) {
    models.Book.findOne({}, function (err, b) {
      assert.ok(!err);
      assert.ok(b);
      assert.ok(b._id);
      request.post({
        url: util.format('%s/api/v1/books/%s', testUrl, b._id),
        json: {
          description: "Updated description"
        }
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.title, b.title);
        assert.equal(body.year, b.year);
        assert.equal(body.description, 'Updated description');
        assert.ok(body.description != b.description)
        assert.ok(body.author);
        assert.ok(body.author instanceof Array);
        assert.ok(body.author.length);
        assert.ok(body.author[0]._id);
        assert.ok(body.author[0].firstName);
        assert.ok(body.author[0].lastName);
        assert.equal(body.author[0]._id, b.author[0]);
        done();
      });
    });
  });

});

describe("Population -- only for details", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people',
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {
          details: {
            populate: 'author'
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

  it("GET /api/v1/people/:id 200 -- get a specific Book (with populated author)", function(done) {
    models.Book.findOne({}, function (err, b) {
      assert.ok(!err);
      assert.ok(b);
      assert.ok(b._id);
      request.get({
        url: util.format('%s/api/v1/books/%s', testUrl, b._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.title, b.title);
        assert.equal(body.year, b.year);
        assert.ok(body.author);
        assert.ok(body.author instanceof Array);
        assert.ok(body.author.length);
        assert.ok(body.author[0]._id);
        assert.ok(body.author[0].firstName);
        assert.ok(body.author[0].lastName);
        assert.equal(body.author[0]._id, b.author[0]);
        done();
      });
    });
  });

  it("GET /api/v1/people/:id 200 -- get all Books (with non-populated author)", function(done) {

    request.get({
      url: util.format('%s/api/v1/books', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 16);
      body.forEach(function(book) {
        assert.ok(book.author instanceof Array);
        assert.ok(book.author.length);
        assert.ok(mongoose.Types.ObjectId.isValid(book.author[0]))
        assert.ok(!book.author[0]._id);
        assert.ok(!book.author[0].firstName);
        assert.ok(!book.author[0].lastName);
      });
      done();
    });
  });

});

describe("Population -- only for list", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people',
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {
          search: {
            populate: 'author'
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

  it("GET /api/v1/books/:id 200 -- get a specific Book (with non-populated author)", function(done) {
    models.Book.findOne({}, function (err, b) {
      assert.ok(!err);
      assert.ok(b);
      assert.ok(b._id);
      request.get({
        url: util.format('%s/api/v1/books/%s', testUrl, b._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.title, b.title);
        assert.equal(body.year, b.year);
        assert.ok(body.author);
        assert.ok(body.author instanceof Array);
        assert.ok(body.author.length);
        assert.ok(mongoose.Types.ObjectId.isValid(body.author[0]))
        assert.ok(!body.author[0]._id);
        assert.ok(!body.author[0].firstName);
        assert.ok(!body.author[0].lastName);
        assert.equal(body.author[0], b.author[0]);
        done();
      });
    });
  });

  it("GET /api/v1/books/ 200 -- get all Books (with populated author)", function(done) {

    request.get({
      url: util.format('%s/api/v1/books', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 16);
      body.forEach(function(book) {
        assert.ok(book.author instanceof Array);
        assert.ok(book.author.length);
        assert.ok(book.author[0]._id);
        assert.ok(book.author[0].firstName);
        assert.ok(book.author[0].lastName);
      });
      done();
    });
  });

});

describe("Population -- with mongoose population options", function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people',
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Book, {populate: {
          path: 'author',
          select: 'isPoet -_id'
        }});
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("GET /api/v1/people/:id 200 -- get a specific Book (with populated author)", function(done) {
    models.Book.findOne({}, function (err, b) {
      assert.ok(!err);
      assert.ok(b);
      assert.ok(b._id);
      request.get({
        url: util.format('%s/api/v1/books/%s', testUrl, b._id)
      }, function (err, res, body) {
        assert.ok(!err);
        assert.equal(res.statusCode, 200);
        if (typeof(body) == "string") {
          body = JSON.parse(body);
        }
        assert.equal(body.title, b.title);
        assert.equal(body.year, b.year);
        assert.ok(body.author);
        assert.ok(body.author instanceof Array);
        assert.ok(body.author.length);
        assert.ok(!body.author[0]._id);
        assert.ok(!body.author[0].firstName);
        assert.ok(!body.author[0].lastName);
        assert.ok(typeof body.author[0].isPoet === 'boolean');
        done();
      });
    });
  });

  it("GET /api/v1/people/:id 200 -- get all Books (with populated author)", function(done) {

    request.get({
      url: util.format('%s/api/v1/books', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 16);
      body.forEach(function(book) {
        assert.ok(book.author instanceof Array);
        assert.ok(book.author.length);
        assert.ok(!book.author[0]._id);
        assert.ok(!book.author[0].firstName);
        assert.ok(!book.author[0].lastName);
        assert.ok(typeof book.author[0].isPoet === 'boolean');
      });
      done();
    });
  });

});
