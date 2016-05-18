var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  create: false,
  update: false,
  delete: false
});

module.exports = exports = api;
