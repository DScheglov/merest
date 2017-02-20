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

describe("Processing 500 Internal Server Error", function (done) {

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
            errorGen: {
              exec: function (options, next) {
                return next(new Error('Artificial error'))
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


  it("POST /api/v1/people/error-gen 500", function(done) {
    request.post({
      url: util.format('%s/api/v1/people/error-gen', testUrl)
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 500);
      if (typeof(body) == "string") {
        body = JSON.parse(body);
      }
      assert.ok(body.error);
      assert.equal(body.message, 'Artificial error');
      done();
    });
  });


});
