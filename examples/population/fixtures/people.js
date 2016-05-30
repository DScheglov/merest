var ObjectId = require("mongoose").Types.ObjectId;

module.exports = exports = [
	{
	    "_id" : ObjectId("564e0da0105badc887ef1d3e"),
	    "firstName" : "Taras",
	    "lastName" : "Shevchenko",
	    "email" : "t.shevchenko@heroes.ua",
      "isPoet": true
	}, {
	    "_id" : ObjectId("564e0da0105badc887ef1d3f"),
	    "firstName" : "Alexander",
	    "lastName" : "Pushkin",
	    "email" : "a.s.pushkin@authors.ru",
      "isPoet": true
	}, {
	    "_id" : ObjectId("564e0da0105badc887ef1d40"),
	    "firstName" : "Jack",
	    "lastName" : "London",
	    "email" : "jack.london@writers.uk",
      "isPoet": false
	}, {
	    "_id" : ObjectId("564e0da0105badc887ef1d41"),
	    "firstName" : "Mark",
	    "lastName" : "Twen",
	    "email" : "m-twen@legends.us",
      "isPoet": false
	}
];
