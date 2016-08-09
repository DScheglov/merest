var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress({
  transformResponse: prepareResponse
});
api.expose(models.Vector);

module.exports = exports = api;

function prepareResponse(req, res) {
  var body = {
    status: this.status,
    data: this.body
  };
  this.status = 200;
  this.body = body;
};
