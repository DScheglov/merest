### Getting started

The simplest way to use **merest** is described bellow.

Let's create three files: `models.js`, `api.js` and `server.js`.
You can use you own project structure just mind the correct paths
in `require` calls.


**models.js**
```javascript
'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VectorSchema = new Schema({
  x: Number,
  y: Number,
  label: String
});

const Vector = mongoose.model('Vector', VectorSchema);

module.exports = exports = {
  Vector: Vector
};
```

**api.js**
```javascript
'use strict';

const merest = require('merest');
const models = require('./models');

const api = new merest.ModelAPIExpress();
api.expose(models.Vector);

module.exports = exports = api;
```

**server.js**
```javascript
'use strict';

const mongoose = require('mongoose');
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/merest-sample');

const app = express();

app.use(bodyParser.json());
app.use(methodOverride());

app.use('/api/v1', require('./api')); // exposing our API

app.listen(1337, function(){
  console.log('Express server is listening on port 1337');
});
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
Posting new vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vectors
```

Output:
```shell
{ "_id": "....................", "x": 0, "y": 777, "__v": 0 }
```


----------------------------------------------
Posting one more vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": -1, "y": 3}' http://localhost:1337/api/v1/vectors
```

Output:
```shell
{  "_id": "....................", "x": -1, "y": 3, "__v": 0 }
```

----------------------------------------------
Listing all vectors:
```shell
curl -g http://localhost:1337/api/v1/vectors
```
Output:
```shell
[
  {"_id": "....................", "x": 0, "y": 777, "__v": 0 },
  {"_id": "....................", "x": -1, "y": 3, "__v": 0 }
]
```

----------------------------------------------
Also you can run this example in this way:

```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/simplest-usage/server
```

Output:
```shell
Express server is listening on port 1337
```
