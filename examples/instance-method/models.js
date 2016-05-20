var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var VectorSchema = new Schema({
  x: Number,
  y: Number,
  label: String,
  info : {
    d: Date,
    tags: [String]
  }
});

VectorSchema.methods.reverse = function(options, done) {
  this.x = -this.x;
  this.y = -this.y;
  return this.save(done);
}

var Vector = mongoose.model('Vector', VectorSchema);
module.exports = exports = {
  Vector: Vector
};
