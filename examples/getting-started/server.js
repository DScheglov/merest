'use strict';

const merest = require('merest-swagger'); // importing merest
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override'); // to support HTTP OPTIONS
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const ContactSchema = new mongoose.Schema({
  name: {type: String, required: true},
  email: String,
  phone: String,
  tags: [String]
});

const Contact = mongoose.model('Contact', ContactSchema);

const api = new merest.ModelAPIExpress({
  title: 'Contact list API',
  path: '/api/v1',
  host: 'ubuntu-local:8000'
});
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

api.expose(Contact);
api.exposeSwaggerUi('/swagger-ui');
app.use('/api/v1', api); // exposing our API

mongoose.connect('mongodb://localhost/merest-sample');
app.listen(8000, function(){
  console.log('Express server listening on port 8000');
});
