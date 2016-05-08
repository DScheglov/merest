## <u>M</u>ongoose <u>E</u>xpress <u>REST</u>-full API

**merest** provides easy way to expose Mongoose models as REST-full api. It creates pointed bellow end-points for each exposed model:
 - `list/search`: **GET** [..\model-plural-name\\]()
 - `create`: **POST** [..\model-plural-name\\]()
 - `details`: **GET** [..\model-plural-name\\:id]()
 - `update`: **POST** [..\model-plural-name\\:id]()
 - `delete`: **DELETE** [..\model-plural-name\\:id]()

 Additionally **merest** implements `OPTION` HTTP-method to return list of created end-points:
 - `all api options`: **OPTIONS** [..\\]()
 - `model api options`: **OPTIONS** [..\model-plural-name\\]()

To provide wide functionality of the Mongoose model **merest** allows you to expose static and instance methods of the model.

### Installation
```shell
npm install merest
```

### Development
```shell
git clone https://github.com/DScheglov/merest
cd merest
npm install
npm test
```

### Example
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
var merest = require(merest);
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
