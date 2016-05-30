var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var PersonSchema = new Schema({
	firstName: {type: String, required: true},
	lastName: {type: String, required: true},
	email: {type: String, required: true, index: true, unique: true},
  isPoet: {type: Boolean, default: false}
});

var BookSchema = new Schema({
	title: {type: String, required: true, index: true},
	year: {type: Number, required: true, index: true},
	author: [{type: Schema.Types.ObjectId, required: true, ref: 'Person'}],
	description: String
});

module.exports = exports = {
  Person: mongoose.model('Person', PersonSchema),
  Book: mongoose.model('Book', BookSchema)
}
