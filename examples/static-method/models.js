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

VectorSchema.statics.reverse = function(options, done) {
  var self = this;
  self.update(options, {$mul: {x:-1, y:-1} }, {multi: true}, function (err) {
    if (err) return done(err);
    return self.find(options, done);
  });
}

var Vector = mongoose.model('Vector', VectorSchema);
module.exports = exports = {
  Vector: Vector
};
