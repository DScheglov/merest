var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override'); // to support HTTP OPTIONS
var api = require('./api');
var fixtures = {
  people: require('./fixtures/people'),
  books: require('./fixtures/books')
}

var Book = mongoose.model('Book');
var Person = mongoose.model('Person');


mongoose.connect('mongodb://localhost/merest-sample');

Book.remove({
}).then(function () {
  return Person.remove({});
}).then(function () {
  return Person.collection.insert(fixtures.people);
}).then(function () {
  return Book.collection.insert(fixtures.books);
}).then(function () {
  return runServer();
}).catch(function (err) {
  console.error('Error: ' + err.message);
  return err;
});

function runServer() {
  var app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());

  app.use('/api/v1', api); // exposing our API

  app.listen(1337, function(){
    console.log('Express server is listening on port 1337');
  });
}
