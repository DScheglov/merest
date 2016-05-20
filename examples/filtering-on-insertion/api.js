var merest = require('../../lib');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  path: '/vertical-vectors',
  filter: {
    x: 0
  },
  fields: '-_id x y',
  create: {
    middlewares: isVerticalVector
  }
});

module.exports = exports = api;

function isVerticalVector(req, res, next) {
  if (req.body.x !== 0) {
    return next(new merest.ModelAPIError(422, 'The vector is not vertical'));
  }
  next();
}
