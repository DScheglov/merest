'use strict';

const merest = require('merest-swagger'); // to support SwaggerUI
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

const app = express();
// Creating the Express application to serve API
const api = new merest.ModelAPIExpress({
  title: 'Contact List API',
  host: 'ubuntu-local:8000', // Assign correct host that could be accessed from your network
  path: '/api/v1',
  options: false // we do not need the OPTIONS any more
});

app.use(bodyParser.json()); // Parsing JSON-bodies
app.use(methodOverride()); // Supporting HTTP OPTIONS and HTTP DELETE methods

api.expose(Contact, { options: false }); // Exposing our API
api.exposeSwaggerUi(); // Exposing swagger-ui

app.use('/api/v1', api); // mounting API as usual sub-application

app.listen(8000, () => {
  console.log('Express server listening on port 8000');
});
