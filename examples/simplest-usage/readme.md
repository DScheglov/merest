### Get started

The simplest way to use **merest** is described bellow.

Let's create three files: `models.js`, `api.js` and `server.js`.
You can use you own project structure just mind the correct paths
in `require` calls.


models.js
```javascript
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

var Vector = mongoose.model('Vector', VectorSchema);
module.exports = exports = {
  Vector: Vector
};
```

api.js
```javascript
var merest = require('merest');
var models = require('./models');

var api = new merest.ModelAPIExpress();
api.expose(models.Vector);

module.exports = exports = api;
```
server.js
```javascript
var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var methodOverride = require('method-override'); // to support HTTP OPTIONS
var api = require('./api');

mongoose.connect('mongodb://localhost/merest-sample');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());

app.use('/api/v1', api); // exposing our API

app.listen(1337, function(){
  console.log('Express server listening on port 1337');
});
```
-----------------------------------------------------------
Running project:
```shell
node server
```
Output:
```shell
Express server listening on port 1337
```
-----------------------------------------------------------
Calling API:
```shell
curl -X OPTIONS http://localhost:1337/api/v1/
```
Output:
```shell
[
  ["options", "/api/v1/", "List all end-points of current application"],
  ["options", "/api/v1/vectors/", "List API-options for vectors"],
  ["get", "/api/v1/vectors/", "List/Search all vectors"],
  ["post", "/api/v1/vectors/", "Create a new Vector"],
  ["get", "/api/v1/vectors/:id", "Find a Vector by Id"],
  ["post", "/api/v1/vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vectors/:id", "Find a Vector by Id and delete it."]
]
```
----------------------------------------------
Posting new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vectors
```
Output:
```shell
{"x": 0, "y": 777, "__v": 0, "info": {"tags":[]}, "_id": "..."}
```
----------------------------------------------
Posting one more new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": -1, "y": 3}' http://localhost:1337/api/v1/vectors
```
Output:
```shell
{"x": -1, "y": 3, "__v": 0, "info": {"tags":[]}, "_id": "..."}
```
----------------------------------------------
Listing all vertical vectors:
```shell
сurl -g http://localhost:1337/api/v1/vectors
```
Output:
```shell
[
  {"x": 0, "y": 777, "__v": 0, "info": {"tags":[]}, "_id": "..."},
  {"x": -1, "y": 3, "__v": 0, "info": {"tags":[]}, "_id": "..."}
]
```


Also you can run this example in this way:
----------------------------------------------
Running example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/simplest-usage/server
```
Output:
```shell
Express server listening on port 1337
```
