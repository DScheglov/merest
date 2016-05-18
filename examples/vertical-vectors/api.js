var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  path: '/vertical-vectors',
  filter: {
    x: 0
  },
  fields: '-_id'
});

module.exports = exports = api;
