var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VectorSchema = new Schema({
  x: Number,
  y: Number,
  label: String
});

var Vector = mongoose.model('Vector', VectorSchema);
module.exports = exports = {
  Vector: Vector
};
