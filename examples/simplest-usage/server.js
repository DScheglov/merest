'use strict';

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/merest-sample');

const app = express();

app.use(bodyParser.json());
app.use(methodOverride());

app.use('/api/v1', require('./api')); // exposing our API

app.listen(1337, function(){
  console.log('Express server is listening on port 1337');
});
