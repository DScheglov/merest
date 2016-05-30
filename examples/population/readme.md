### Population

Let's guess we need to lookup for a field values in separate collection.
**Mongoose** allows us to do so by using method `populate` of `Model` and
`Document` instancies.

To use this method with **merest** you should to specify API-option `populate` on the Model-routes or an end-point level.

This option takes all supported by `Mongoose.Model#populate` values and transfers
it to appropriate call of `populate` method.


To consider the `populate` option let's add two new models in our example:

**models.js**
```javascript
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
```

Then we should to configure our Model-routes with assigning `populate` option.

**api.js**
```javascript
var merest = require('merest');
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
```

**NOTE**: Lookout we use the following fixtures files to demonstrate **merest** population
support, so you have to update the `server.js` file with code manages the fixtures.

**fixtures/people.js**
```javascript
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
```

**fictures/books.js**
```javascript
var ObjectId = require("mongoose").Types.ObjectId;

module.exports = exports = [
    {
    	"title": "What Have the Police Been Doing?",
      "year": 1866,
      "author": ObjectId("564e0da0105badc887ef1d41"), // Mark Twain
      "description": "..."
    }, {
      "title": "The Celebrated Jumping Frog of Calaveras County",
      "year": 1867,
      "author": ObjectId("564e0da0105badc887ef1d41"), // Mark Twain
      "description": "..."
    }, {
      "title": "Innocents Abroad",
      "year": 1869,
      "author": ObjectId("564e0da0105badc887ef1d41"), // Mark Twain
      "description": "..."
    }, {
      "title": "Autobiography and First Romance",
      "year": 1871,
      "author": ObjectId("564e0da0105badc887ef1d41"), // Mark Twain
      "description": "..."
    }, {
      "title": 'In the Fortress ("It does not touch me, not a whit")',
      "year": 1847,
      "author": ObjectId("564e0da0105badc887ef1d3e"), // Taras Shevchenko
      "description": "..."
    }, {
      "title": 'Zapovit',
      "year": 1845,
      "author": ObjectId("564e0da0105badc887ef1d3e"), // Taras Shevchenko
      "description": "..."
    }, {
      "title": 'Kobzar',
      "year": 1840,
      "author": ObjectId("564e0da0105badc887ef1d3e"), // Taras Shevchenko
      "description": "..."
    }, {
      "title": 'Ruslan and Ludmila',
      "year": 1820,
      "author": ObjectId("564e0da0105badc887ef1d3f"), // Alexander Pushkin
      "description": "..."
    }, {
      "title": 'The Prisoner of the Caucasus',
      "year": 1821,
      "author": ObjectId("564e0da0105badc887ef1d3f"), // Alexander Pushkin
      "description": "..."
    }, {
      "title": 'Boris Godunov',
      "year": 1825,
      "author": ObjectId("564e0da0105badc887ef1d3f"), // Alexander Pushkin
      "description": "..."
    }, {
      "title": 'The Little Tragedies',
      "year": 1830,
      "author": ObjectId("564e0da0105badc887ef1d3f"), // Alexander Pushkin
      "description": "..."
    }, {
      "title": 'The Cruise of the Dazzler',
      "year": 1902,
      "author": ObjectId("564e0da0105badc887ef1d40"), // Jack London
      "description": "..."
    }, {
      "title": 'A Daughter of the Snows',
      "year": 1902,
      "author": ObjectId("564e0da0105badc887ef1d40"), // Jack London
      "description": "..."
    }, {
      "title": "An Old Soldier's Story",
      "year": 1894,
      "author": ObjectId("564e0da0105badc887ef1d40"), // Jack London
      "description": "..."
    }, {
      "title": "Who Believes in Ghosts!",
      "year": 1895,
      "author": ObjectId("564e0da0105badc887ef1d40"), // Jack London
      "description": "..."
    }, {
      "title": "The hypothetical work 1",
      "year": 2016,
      "author": [
        ObjectId("564e0da0105badc887ef1d40"), // Jack London
        ObjectId("564e0da0105badc887ef1d3e"), // Taras Shevchenko
      ]
    }
];
```
-----------------------------------------------------------
Running project:
```shell
node server
```
Output:
```shell
Express server is listening on port 1337
```
-----------------------------------------------------------
**Calling API**:
```shell
 curl -g http://localhost:1337/api/v1/books?_limit=3&_sort=-year
```

As you can see we used two queryString parameters:
 - `_limit = 3` - to limit search results with 3 documents only
 - `_sort = -year` - to order documents (books) by `year` field in descendant order

**Output**:
```shell
[
  {
    "_id": "...",
    "title": "The hypothetical work 1",
    "year": 2016,
    "author": [{
        "firstName": "Jack",
        "lastName": "London"
      }, {
        "firstName": "Taras",
        "lastName": "Shevchenko"
      }
    ]
  }, {
    "_id": "...",
    "title": "The Cruise of the Dazzler",
    "year": 1902,
    "description": "...",
    "author": [{
        "firstName": "Jack",
        "lastName": "London"
      }]
  }, {
    "_id": "...",
    "title": "A Daughter of the Snows",
    "year": 1902,
    "description": "...",
    "author": [{
        "firstName": "Jack",
        "lastName": "London"
      }]
  }
]
```

----------------------------------------------
Also you can run this example in this way:

```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/population/server
```
Output:
```shell
Express server is listening on port 1337
```
