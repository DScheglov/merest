var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require('util');
var assert = require('assert');

var app = require('../setup/app');
var db = require('../setup/db');
var models = require('../models');
var api = require("../../lib");


var testPort = 30023;
var testUrl = 'http://127.0.0.1:' + testPort;

var people = require('../fixtures/people');

describe('Searching with __<oper>', function (done) {

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
        modelAPI.expose(models.Person);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });

  it("GET /api/v1/books?year__lt=1900 200 -- get books issued before 1900", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__lt=1900', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 13);
      assert.ok(body.every(b => b.year < 1900));
      done();
    });

  });

  it("GET /api/v1/books?year__gte=1902 200 -- get books issued in 1902 and later", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__gte=1902', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 3);
      assert.ok(body.every(b => b.year >= 1902));
      done();
    });

  });

  it("GET /api/v1/books?year__in=1902,2016 200 -- get books issued in 1902 and 2016", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__in=1902,2016', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 3);
      assert.ok(body.every(
        b => (b.year === 1902 || b.year === 2016)
      ));
      done();
    });

  });

  it("GET /api/v1/books?year__nin=1902,2016 200 -- get books issued not in 1902 and 2016", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__nin=1902,2016', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 13);
      assert.ok(body.every(
        b => (b.year !== 1902 && b.year !== 2016)
      ));
      done();
    });

  });

  it("GET /api/v1/books?description__ex=0 200 -- get books without description", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?description__ex=0', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.ok(body.every(b => b.description == null));
      done();
    });

  });

  it("GET /api/v1/books?description__ex=1 200 -- get books with description", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?description__ex=1', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 15);
      assert.ok(body.every(b => b.description != null));
      done();
    });

  });

  it("GET /api/v1/books?year__gt=1900&year__lt=2000 200 -- get books issued between 1900 and 2000", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__gt=1900&year__lt=2000', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 2);
      assert.ok(body.every(b => (b.year > 1900) && (b.year < 2000)));
      done();
    });

  });

  it("GET /api/v1/books?year__gt=1900&year__lt=2000&year=1902 200 -- get books issued between 1900 and 2000 (exactly in 1902)", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__gt=1900&year__lt=2000', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 2);
      assert.ok(body.every(b => b.year === 1902));
      done();
    });

  });

  it("GET /api/v1/books?year__lt=1900&year__gt=2000&year=1866 200 -- get books issued before 1900 and after 2000 (exactly in 1866)", function (done) {

    request.get({
      url: util.format('%s/api/v1/books?year__lt=1900&year__gt=2000&year=1866', testUrl)
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

  it("GET /api/v1/people?email__re=/.+?\\.(RU|UA)/i 200 -- get people with email ends ru or ua", function (done) {

    request.get({
      url: util.format('%s/api/v1/people?email__re=/.+?\\.(RU|UA)/i', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 2);
      assert.ok(body.every(
        p => (p.email == 'a.s.pushkin@authors.ru') ||
             (p.email == 't.shevchenko@heroes.ua')
      ));
      done();
    });

  });

  it("GET /api/v1/people?firstName__re=a 200 -- get people with 'a' in firstName", function (done) {

    request.get({
      url: util.format('%s/api/v1/people?firstName__re=a', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 4);
      assert.ok(body.every(
        p => p.firstName.indexOf('a') >= 0
      ));
      done();
    });

  });

  it("GET /api/v1/people?firstName__re=A 200 -- get people with 'a' in firstName", function (done) {

    request.get({
      url: util.format('%s/api/v1/people?firstName__re=A', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.ok(body.every(
        p => p.firstName.indexOf('A') >= 0
      ));
      done();
    });

  });

  it("GET /api/v1/people?firstName__re=/^a/i 200 -- get people with firstName starting with 'a'", function (done) {

    request.get({
      url: util.format('%s/api/v1/people?firstName__re=/^a/i', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.equal(body.length, 1);
      assert.ok(body.every(
        p => 'aA'.indexOf(p.firstName[0]) >= 0
      ));
      done();
    });

  });

});
