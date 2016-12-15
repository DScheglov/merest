'use strict';

const merest = require('merest');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

// Defining model
const mongoose = require('mongoose');
const Contact = mongoose.model('Contact', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: String,
  tags: [String]
}));
mongoose.connect('mongodb://localhost/merest-sample');

// Creating the Express application to serve API
const api = new merest.ModelAPIExpress();

api.use(bodyParser.json()); // Parsing JSON-bodies
api.use(methodOverride()); // Supporting HTTP OPTIONS and HTTP DELETE methods

api.expose(Contact); // Exposing our API

api.listen(8000, () => {
  console.log('Express server listening on port 8000');
});
