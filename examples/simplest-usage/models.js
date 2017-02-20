'use strict';

const mongoose = require('mongoose');

const VectorSchema = new mongoose.Schema({
  x: Number,
  y: Number,
  label: String
});

VectorSchema.get('label', function () {
  console.dir('label - get called')
  return this.label || `(${this.x}; ${this.y})`;
})

const Vector = mongoose.model('Vector', VectorSchema);

module.exports = exports = {
  Vector: Vector
};
