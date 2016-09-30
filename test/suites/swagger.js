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

describe("Swagger documentation", function (done) {

  beforeEach(function (done) {

    async.waterfall([
      app.init, db.init,
      db.fixtures.bind(null, {
        Person: '../fixtures/people'
      }),
      function (next) {
        var modelAPI = new api.ModelAPIExpress({swagger: true});
        modelAPI.expose(models.Person);
        modelAPI.expose(models.Book);
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  afterEach(function (done) {
    async.waterfall([db.close, app.close], done)
  });


  it("GET /api/v1/swagger.json -- get swagger doc", function (done) {
    request.get({
      url: util.format('%s/api/v1/swagger.json', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 200);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      //assert.equal(body.length, 7);
      console.log(JSON.stringify(body, '', '  '));
      //console.dir(body, {depth: null});
      done();
    });

  });

});
