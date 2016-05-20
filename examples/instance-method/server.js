var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override'); // to support HTTP OPTIONS
var api = require('./api');
var fixtures = require('./fixtures');
var Vector = mongoose.model('Vector');

mongoose.connect('mongodb://localhost/merest-sample');

Vector.remove({}, function (err) {
  if (err) {
    console.error('Error: ' + err.message);
    return err;
  }
  Vector.collection.insert(fixtures, runServer);
});

function runServer(err) {
  if (err) {
    console.error('Error: ' + err.message);
    return err;
  }
  var app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());

  app.use('/api/v1', api); // exposing our API

  app.listen(1337, function(){
    console.log('Express server is listening on port 1337');
  });
}
