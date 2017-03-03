'use strict';

const App = require('./model-api-app');
const Resource = require('./model-api-router');
const Err = require('./model-api-error');
const op = require('./operators');

module.exports = exports = {
  ModelAPIError: Err,
  'Error': Err,
  ModelAPIRouter: Resource,
  Resource: Resource,
  ModelAPIExpress: App,
  Application: App,
  operators: op
}
