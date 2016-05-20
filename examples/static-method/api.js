var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  fields: 'x y',
  exposeStatic: {
    reverse: 'get'
  }
});

module.exports = exports = api;
