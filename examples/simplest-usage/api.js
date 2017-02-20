'use strict';

const merest = require('../../lib');
const models = require('./models');

const api = new merest.ModelAPIExpress();
api.expose(models.Vector);

module.exports = exports = api;
