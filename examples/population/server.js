'use strict';

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override'); // to support HTTP OPTIONS
const api = require('./api');
const fixtures = {
  people: require('./fixtures/people'),
  books: require('./fixtures/books')
}

const Book = mongoose.model('Book');
const Person = mongoose.model('Person');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/merest-sample');

Book.remove({})
  .then( () => Person.remove({}) )
  .then( () => Person.collection.insert(fixtures.people) )
  .then( () => Book.collection.insert(fixtures.books) )
  .then( () => runServer() )
  .catch( err => {
    console.error('Error: ' + err.message);
    return err;
  });

function runServer() {
  const app = express();

  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(methodOverride());

  app.use('/api/v1', api); // exposing our API

  app.listen(1337, function(){
    console.log('Express server is listening on port 1337');
  });
}
