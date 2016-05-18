## <u>M</u>ongoose <u>E</u>xpress <u>REST</u>-full API

**merest** provides easy way to expose Mongoose models as REST-full api. It creates pointed bellow end-points for each exposed model:
 - `list/search`: **GET** [..\model-plural-name\\ ]()
 - `create`: **POST** [..\model-plural-name\\ ]()
 - `details`: **GET** [..\model-plural-name\\:id]()
 - `update`: **POST** [..\model-plural-name\\:id]()
 - `delete`: **DELETE** [..\model-plural-name\\:id]()

 Additionally **merest** implements `OPTION` HTTP-method to return list of created end-points:
 - `all api options`: **OPTIONS** [..\\ ]()
 - `model api options`: **OPTIONS** [..\model-plural-name\\ ]()

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
---------------------------------------------------

#### Requests and Responses:

##### End-point `options`:
Request:

Header / Body | Value | Description
------------- | ------- | ---------------
X-HTTP-Method-Override | `OPTIONS` | You should add this header if your client doesn't support OPTIONS method directly
Body | empty |


Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
200 | Array of end-points | List of mounted end-points
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled

-------------------------------------------------
##### End-point `search`:
Request for end-point mounted on `GET`:

Header / Body | Value
------------- | -----
Headers | none |
Query | Query String
Body | empty |

Query String could contain pares fieldName=value separated by the `&`
and three additional parameters:
- _sort=fieldName
- _limit=maximum number of documents in Response
- _skip=number of document that should be skipped in Response

These parameters (all of them or any of them) will be ignored if
appropriate API-configuration option will be assigned to `false`

Request for end-point mounted on `POST`:

Header / Body | Value | Description
------------- | ----- | -----------
Content-Type | application/json |
Query | | additional parameters of Query String (see above)
Body | `Object` | Mongoose query object.

Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
200 | `Array` | Array of found documents (Empty if no document was found)
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled


-------------------------------------------------
##### End-point `details`:
Request for end-point mounted on `GET`:

Header / Body | Value
------------- | -----
Headers | none |
Body | empty |

Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
200 | `Object` | Document that was found by id
404 | `{"error": true, "code": 405, "message": "..."}` | Object was not found by id in the url and/or doesn't match the assigned `filter` option
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled


---------------------------------------------------
##### End-point `create`:
Request:

Header / Body | Value | Description
------------- | ----- | -----------
Content-Type | application/json |
Body | `Object` | Mongoose Model object.

Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
201 | `Object` | Created object
404 | `{"error": true, "code": 404, "message": "..."}` | Created object doesn't match `filter` specified on the exposition
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled
422 | `{"error": true, "code": 422, "message": "...", "errors": {...}}` | Description of validation error

---------------------------------------------------
##### End-point `update`:
Request:

Header / Body | Value | Description
------------- | ----- | -----------
Content-Type | application/json |
Body | `Object` | Mongoose update object (`$set`-object).

Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
200 | `Object` | Updated object
404 | `{"error": true, "code": 404, "message": "..."}` | Object was not found by id in the url and/or doesn't match the assigned `filter` option
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled
422 | `{"error": true, "code": 422, "message": "...", "errors": {...}}` | Description of validation error


---------------------------------------------------
##### End-point `delete`:
Request:

Header / Body | Value
------------- | -----
Headers | none
Body | Empty

Responses:

HTTP Code | Response body | Description
--------- | ------------- | -----------
200 | `{}` | Empty object
404 | `{"error": true, "code": 404, "message": "..."}` | Object was not found by id in the url and/or doesn't match the assigned `filter` option
405 | `{"error": true, "code": 405, "message": "Not Supported"}` | If end-point is disabled


------------------------------------------------------------------
### API Configuration
'merest' supports range of options to expose Mongoose models.
The `ModelAPIExpress.expose()` method receives the options object as the last parameter:
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  options: false, // disable end-point for OPTIONS method
  fields: {
    // all end-points (except the exposed model methods)
    // will return only specified fields
    x: true,
    y: true,
    _id: false
  }
});
```

#### Supported API options:

#####Options to control API end-points:
 - **options**: `Boolean|String|Object` -  configuration for OPTIONS HTTP-method
 - **create**: `Boolean|String|Object` - configuration for Instance creation
 - **search**: `Boolean|String|Object` - configuration for searching of instances-
 - **details**: `Boolean|String|Object` - configuration for instance details end-point
 - **update**: `Boolean|String|Object` - configuration for instance update
 - **delete**: `Boolean|String|Object` - configuration for instance removing


Each mentioned above option could be one of: `Boolean`, `String` and `Object`.
##### In case of `Boolean`:
 - `false`: appropriate end-point is disabled
 - `true`: the end-point is allowed and default or common (see further) options will be used to configure it

##### In case of `String`:
If value is some of HTTP-method supported by Express (`checkout`, `copy`, `delete`, `get`, `head`, `lock`, `merge`, `mkactivity`, `mkcol`, `move`, `'m-search'`, `notify`, `options`, `patch`, `post`, `purge`, `put`, `report`, `search`, `subscribe`, `trace`, `unlock`, `unsubscribe`), then the appropriate method is allowed and will be
mount on specified HTTP-method.
Otherwise the value will be used as a description of the appropriate end-point returned
by the OPTIONS HTTP-method

##### In case of `Object`:
The appropriate end-point is allowed and keys of the value will be used to configure this end-point.

The end-point configuration options are bellow.

##### End-point configuration options:
- **path**: `String` - path to end-point overrides default path
- **method**: `String` -- HTTP-method to mount appropriate end-point
- **filter**: `Object|Function` - Mongoose query-object or function that returns such object. The function receives `request` (Express Incoming Message) as only parameter. The function is executing in synchronous mode.
- **fields**: `Object|Array|String` - Mongoose field-selection parameter
- **readonly**: __reserved__,
- **queryFields**: `Object` - keys of the objects are names of fields. If value of the key is equal to false, the correspondent field will be excluded from the query. Affects on `search` end-point only.
- **populate**: `Array|Object|String` - Mongoose field population parameter
- **skip**: `Boolean` - allows or disables skipping documents in the search result. Affects on `search` end-point only.
- **limit**: `Boolean` - allows on denies limitation of documents in the search result. Affects on `search` end-point only.
- **sort**: `Boolean|Object` -- allows or denies (in case of `false`) the sorting. Object keys are names of the fields. The value of appropriate key allows or denies to sort by this field. Affects on `search` end-point only. The mongodb field paths could be used as keys of `sort`-object.
- **middlewares**: `Function|Array` - middleware function or array of such functions. The middleware(s) will be mounted to the end-point route as usual express middleware
- **matchId**: `String|RegExp` - the pattern to match values of `id` (`_id`) field in the end-point path. The default is `'[a-f\\d]{24}'`
- **title**: `String` - the description of the end-point

Each of described above options (excl. `method`) could be assigned also on the Model-routes level. In this case it will be applied to all allowed end-points if end-point doesn't override appropriate option directly.

```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, { // Model-routes level
  options: false, // end-point level
  update: 'put', // end-point level - update controller will be mounted on the PUT HTTP-method
  search: { // end-point level - search controller will be mounted
    method: 'post',  // on the POST HTTP-method
    path: '/search'  // on /search
  }
  fields: { // Model-routes level
    x: true,
    y: true,
    _id: false
  }
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
  ["post", "/api/v1/vectors/search", "List/Search all vectors"],
  ["post", "/api/v1/vectors/", "Create a new Vector"],
  ["get", "/api/v1/vectors/:id", "Find a Vector by Id"],
  ["put", "/api/v1/vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vectors/:id", "Find a Vector by Id and delete it."]
]
```
If option **path** is assigned on the Model-routes level it will be used as end-point sub-path
instead of Model collection name (plural).

#### API configuration cook-book

##### Read only exposition
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  create: false,
  update: false,
  delete: false
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
  ["get", "/api/v1/vectors/:id", "Find a Vector by Id"]
]
```

##### Exposition with filtering

```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  path: '/vertical-vectors',
  filter: {
    x: 0
  },
  fields: '-_id'
});
```
Fixtures for this example:
```javascript
module.exports = exports = [
  {x: 1, y: 2},
  {x: 0, y: 3},
  {x: -1, y: 5},
  {x: 0, y: -1},
  {x: 3, y: 0},
  {x: 3, y: 3}
]
```

Getting API-options:
```shell
curl -X OPTIONS http://localhost:1337/api/v1/
```
Output:
```shell
[
  ["options", "/api/v1/", "List all end-points of current application"],
  ["options", "/api/v1/vertical-vectors/", "List API-options for vectors"],
  ["get", "/api/v1/vertical-vectors/", "List/Search all vectors"],
  ["post", "/api/v1/vertical-vectors/", "Create a new Vector"],
  ["get", "/api/v1/vertical-vectors/:id", "Find a Vector by Id"],
  ["post", "/api/v1/vertical-vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vertical-vectors/:id", "Find a Vector by Id and delete it."]
]
```
Listing all vertical vectors:
```shell
сurl -g http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
[
  {"x": 0, "y": 3},
  {"x": 0, "y": -1}
]
```

Posting new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"x": 0, "y": 777, "__v": 0, "info": {"tags":[]}}
```

**WARNING** Posting not vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 7, "y": -123}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"error": true, "code": 404, "message": "The Vector was not found by 573c796d514ee310081c7d42"}
```

The **merest** created new vector and then tries to find it by `_id` and with filter specified
on the exposition stage. According that the new vector is not a vertical, **merest** couldn't
find it and returns 404 HTTP Response code, however the vector was created successfully.

If such behaviour is unwanted (in major cases it is) -- see the simplest way around

##### Filtering on insertion
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  path: '/vertical-vectors',
  filter: {
    x: 0
  },
  fields: '-_id x y',
  create: {
    middlewares: isVerticalVector
  }
});

function isVerticalVector(req, res, next) {
  if (req.body.x !== 0) {
    return next(new merest.ModelAPIError(422, 'The vector is not vertical'));
  }
  next();
}
```

Posting new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"x": 0, "y": 777}
```

**WARNING** Posting not vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 7, "y": -123}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"error": true, "code": 422, "message": "The vector is not vertical"}
```



##### Options for model methods exposition
- expose: `Object` - configuration for end-points that expose the instance methods defined on its schema
- exposeStatic:`Object` - configuration for end-points that expose static model methods defined on its schema.
