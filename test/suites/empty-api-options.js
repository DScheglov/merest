var async = require('async');
var mongoose = require('mongoose');
var request = require("request");
var util = require("util");
var assert = require('assert');

var app = require('../setup/app');
var api = require("../../lib");


var testPort = 30023;
var testUrl = 'http://127.0.0.1:' + testPort;

describe("Empty API OPTIONS", function (done) {

  var modelAPI;

  before(function (done) {

    async.waterfall([
      app.init,
      function (next) {
        modelAPI = new api.ModelAPIExpress({
          options: false
        });
        app.use('/api/v1/', modelAPI);
        app.listen(testPort, next);
      }
    ], done);
  });

  after(function (done) {
    async.waterfall([app.close], done)
  });

  it("OPTIONS /api/v1 405", function (done) {
    request.post({
      url: util.format('%s/api/v1', testUrl),
      headers: {
        "X-HTTP-Method-Override": "OPTIONS"
      }
    }, function (err, res, body) {
      assert.ok(!err);
      assert.equal(res.statusCode, 405);
      done();
    });

  });

  it('should return empty array of urls', function(done) {
    assert.deepEqual(modelAPI.urls(), []);
    done();
  });

});
