var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Person);
api.expose(models.Book, {
  populate: {
    path: 'author',
    select: 'firstName lastName -_id'
  }
});

module.exports = exports = api;
