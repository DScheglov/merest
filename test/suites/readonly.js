'use strict';

const async = require('async');
const mongoose = require('mongoose');
const request = require('request');
const util = require('util');
const assert = require('assert');

const app = require('../setup/app');
const db = require('../setup/db');
const models = require('../models');
const api = require('../../lib');


const testPort = 30023;
const testUrl = 'http://127.0.0.1:' + testPort;

describe('Readonly cleaning - router level', function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          readonly: '_id'
        });
        modelAPI.expose(models.Book);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it('POST /api/v1/people 201 -- should ignore passed _id value', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        _id: id,
        firstName: 'John',
        lastName: 'Johnson',
        email: 'john.johnson@i.ua'
      }
    }, function (err, res, person) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      if (typeof person === 'string') {
        person = JSON.parse(person);
      }
      assert.notEqual(person._id.toString(), id)
      done();
    });

  });

  it('POST /api/v1/books 201 -- should accept passed _id value', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/books', testUrl),
      json: {
        '_id': id,
      	'title': 'New book title',
        'year': 2017,
        'author': '564e0da0105badc887ef1d41', // Mark Twain
        'description': 'Some book annotation'
      }
    }, function (err, res, book) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      if (typeof book === 'string') {
        book = JSON.parse(book);
      }
      assert.equal(book._id.toString(), id)
      done();
    });

  });

  it('POST /api/v1/people/:id 200 -- should ignore passed _id value', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/people/564e0da0105badc887ef1d3e', testUrl),
      json: {
        _id: id,
        firstName: 'Johnathan',
        lastName: 'Johnson',
        email: 'j.j@google.com'
      }
    }, function (err, res, person) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof person === 'string') {
        person = JSON.parse(person);
      }
      assert.notEqual(person._id.toString(), id)
      assert.equal(person._id.toString(), '564e0da0105badc887ef1d3e');
      done();
    });

  });

});

describe('Readonly cleaning - end-point level (update)', function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people',
        Book: '../fixtures/books'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          update: { readonly: '_id!' }
        });
        modelAPI.expose(models.Book, {
          create: { readonly: 'description' }
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it('POST /api/v1/people 201 -- should accept passed _id value', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        _id: id,
        firstName: 'John',
        lastName: 'Johnson',
        email: 'john.johnson@i.ua'
      }
    }, function (err, res, person) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      if (typeof person === 'string') {
        person = JSON.parse(person);
      }
      assert.equal(person._id.toString(), id)
      done();
    });

  });

  it('POST /api/v1/people/:id 422 -- should throw exception if _id value passed', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/people/564e0da0105badc887ef1d3e', testUrl),
      json: {
        _id: id,
        firstName: 'Johnathan',
        lastName: 'Johnson',
        email: 'j.j@google.com'
      }
    }, function (err, res, person) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      done();
    });

  });

  it('POST /api/v1/books 201 -- should ignore passed <description> value', function (done) {
    request.post({
      url: util.format('%s/api/v1/books', testUrl),
      json: {
        'title': 'New book title',
        'year': 2017,
        'author': '564e0da0105badc887ef1d41', // Mark Twain
        'description': 'Some book annotation'
      }
    }, function (err, res, book) {
      assert.ok(!err);
      assert.equal(res.statusCode, 201);
      if (typeof book === 'string') {
        book = JSON.parse(book);
      }
      assert.ok(!book.description)
      done();
    });

  });

  it('POST /api/v1/books/:id 200 -- should accept passed <description>', function (done) {
    request.post({
      url: util.format('%s/api/v1/books/564e0da0105badc887ef1c42', testUrl),
      json: {
        'title': 'Updated title',
        'description': 'Some book annotation'
      }
    }, function (err, res, book) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof book === `string`) {
        book = JSON.parse(book);
      }
      assert.equal(book.description, 'Some book annotation')
      done();
    });

  });

});

describe('Readonly restrictions', function (done) {

  before(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress();
        modelAPI.expose(models.Person, {
          readonly: '_id!'
        });
        modelAPI.expose(models.Book, {
          update: {
            readonly: 'description!'
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

  it('POST /api/v1/people 422 -- should throw error if _id passed', function (done) {
    let id = mongoose.Types.ObjectId().toString();
    request.post({
      url: util.format('%s/api/v1/people', testUrl),
      json: {
        _id: id,
        firstName: 'John',
        lastName: 'Johnson',
        email: 'john.johnson@i.ua'
      }
    }, function (err, res, person) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      done();
    });

  });

  it('POST /api/v1/books/:id 422 -- should throw error if <description> passed', function (done) {
    request.post({
      url: util.format('%s/api/v1/books/564e0da0105badc887ef1c42', testUrl),
      json: {
        'title': 'Updated title',
        'description': 'Some book annotation'
      }
    }, function (err, res, book) {
      assert.ok(!err);
      assert.equal(res.statusCode, 422);
      done();
    });

  });

});
