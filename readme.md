## <u>M</u>ongoose <u>E</u>xpress <u>REST</u>-full API

##### [Cook book](#cook-book) | [Requests and responses](#requests_responses) | [API configuration](#api_config) | [Methods API](#methods_api) | [To Do](#to-do)

**merest** provides easy way to expose Mongoose models as REST-full api. It creates pointed bellow end-points for each exposed model:
 - `list/search`: **GET** [..\\model-plural-name\\ ](#ep_search)
 - `create`: **POST** [..\\model-plural-name\\ ](#ep_create)
 - `details`: **GET** [..\\model-plural-name\\:id](#ep_details)
 - `update`: **POST** [..\\model-plural-name\\:id](#ep_update)
 - `delete`: **DELETE** [..\\model-plural-name\\:id](#ep_details)

 Additionally **merest** implements `OPTIONS` HTTP-method to return list of created end-points:
 - `all api options`: **OPTIONS** [..\\ ](#ep_options)
 - `model api options`: **OPTIONS** [..\model-plural-name\\ ](#ep_options)

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

Detailed example:
[Get started](https://github.com/DScheglov/merest/tree/master/examples/simplest-usage)

<a name="cook-book"></a>

-------------------------------------------------------------------------------
### Cook-book

 - [Get started](https://github.com/DScheglov/merest/tree/master/examples/simplest-usage)
 - [Read-only exposition](https://github.com/DScheglov/merest/tree/master/examples/read-only)
 - [Exposition with filtering](https://github.com/DScheglov/merest/tree/master/examples/vertical-vectors)
 - [Filtering on insertion](https://github.com/DScheglov/merest/tree/master/examples/filtering-on-insertion)
 - [Exposition of Instance method](https://github.com/DScheglov/merest/tree/master/examples/instance-method)
 - [Exposition of static method](https://github.com/DScheglov/merest/tree/master/examples/static-method)


---------------------------------------------------
<a name="requests_responses"></a>
### Requests and Responses:

#### The paths of REST end-points:

The end-point path consists of three parts:
/[`api-mount-path`/]`model-exposition-path`/[`additional-path`/]

 - **api-mount-path** -- the path that assigned in the `use` method called to
   bind the ModelAPIExpress to your main application. This path could be omitted
   in two cases: 1) the path omitted in the `use` method, or 2) the ModelAPIExpress
   is main application (it's also possible)
 - **model-exposition-path** - by default it is the collection name of exposed
   Model. This path could be overrided by assigning `path` api-option on the
   Model-routes level (see API-configuration)
 - **additional-path** - by default it is omitted. It could be assigned by
   specifying `path` api-option on the end-point level (see API-configuration)

**merest** grants that assigned by default paths for different end-points are not
intercepted, but it doesn't control the interception for custom assigned paths.

<a name="common_responses"></a>
#### Common responses

##### 404 - Document was not found (or doesn't exist)
**merest** returns this response if it couldn't find the Document (including
just created) by id in the url and/or doesn't match the assigned `filter`
api-option

```shell
Status: 404
Content-Type: application/json; charset=utf-8

{"error": true, "code": 404, "message": "..."}
```

##### 405 - End-point is not supported:
**merest** returns this response if requested path doesn't associated with any
handler.

**Note**: instead of common practice for HTTP **merest** return 405 HTTP Response
code, but not 404 that means: Document was not found (or doesn't exist).
```shell
Status: 405
Content-Type: application/json; charset=utf-8

{"error": true, "code": 405, "message": "Not Supported"}
```

##### 422 - Validation error
```shell
Status: 422
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "code": 422,
  "message": "..."
  [,"errors": {
    ...
  }]
  [,"stack": [
    ...
  ]]
}
```
The fields `errors` and `stack` are optional.

<a name="ep_options"></a>

--------------------------------------------------------------
##### End-point `options`:
Returns list of available end-points with short description.

Request:
```shell
OPTIONS /end-point-path/ HTTP/1.1
HOST: hostname:port
```
If you client doesn't support OPTIONS HTTP-method directly, use this message:
```shell
POST /end-point-path/ HTTP/1.1
HOST: hostname:port
X-HTTP-Method-Override: OPTIONS
```

Responses:

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

[
  ["method", "path", "descriptions"],
  ["method", "path", "descriptions"],
  ...
  ["method", "path", "descriptions"]
]
```

Other responses:
 - 405 - End-point is not supported

<a name="ep_search"></a>

-------------------------------------------------
##### End-point `search`:
Returns the list of Documents that satisfy query passed to call.

Request for end-point mounted on `GET`:
```shell
GET /end-point-path/[?field1=value1&field2=value2&_sort=fieldName&_limit=number&_skip=number] HTTP/1.1
HOST: hostname:port
```

Query String could contain pares field=value separated by the `&`
and three additional parameters:
- _sort=fieldName
- _limit=maximum number of documents in Response
- _skip=number of document that should be skipped in Response

These parameters (all of them or any of them) will be ignored if
appropriate API-configuration option will be assigned to `false`

To use all **MongoDB** query opportunities you could mount the `create` end-point
on the POST HTTP-method and specify `additional-path`.

In security reasons I don't recommend to do so. The better way is to extend Model
with static methods that accepts only necessary parameters and builds safe query.
However **merest** allows you to mount `search` end-point on POST method and
form query on the client-side.

Request for end-point mounted on `POST`:
```shell
POST /end-point-path/[?_sort=fieldName&_limit=number&_skip=number] HTTP/1.1
HOST: hostname:port
Content-Type: application/json

<Mongoose Query-Object>
```

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

[
  { ... },
  { ... }
  ...
  { ... }
]
```
If no one Document found, the **merest** returns empty Array

Other responses:
 - 405 - End-point is not supported

<a name="ep_details"></a>

-------------------------------------------------
##### End-point `details`:
Returns Document of the exposed Model by its id specified in the URL.

Request:
```shell
GET /end-point-path/:id HTTP/1.1
HOST: hostname:port
```

Responses:

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

{ ... }
```

Other responses:
 - 404 - Document was not found (or doesn't exist)
 - 405 - End-point is not supported

<a name="ep_create"></a>

---------------------------------------------------
##### End-point `create`:
Creates new Document, finds it and returns to the client.

Request:
```shell
POST /end-point-path/ HTTP/1.1
HOST: hostname:port
Content-Type: application/json

<Mongoose Model Object>
```

Responses:

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

{ ... }
```

406 - Method doesn't allow to update object
```shell
Status: 406
Content-Type: application/json; charset=utf-8

{
  "error": true,
  "code": 406,
  "message": "This method doesn't allow to update a(n) ${Model.name}"
}
```

Other responses:
 - 404 - Document was not found (or doesn't exist)
 - 405 - End-point is not supported
 - 422 - Validation error

The Response with status code 404 could be returned if created object doesn't
match `filter` api-option specified on the exposition.

<a name="ep_update"></a>

---------------------------------------------------
##### End-point `update`:
Updates the existing Document, returns it to the client.

Request:
```shell
POST /end-point-path/:id HTTP/1.1
HOST: hostname:port
Content-Type: application/json

<Mongoose $set-object>
```

Responses:

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

{ ... }
```

Other responses:
 - 404 - Document was not found (or doesn't exist)
 - 405 - End-point is not supported
 - 422 - Validation error

<a name="ep_delete"></a>

---------------------------------------------------
##### End-point `delete`:
Finds Document by id specified in the URL, deletes it and returns empty
JSON-object to the client.

Request:
```shell
DELETE /end-point-path/:id HTTP/1.1
HOST: hostname:port
```

If you client doesn't support DELETE HTTP-method directly, use this message:
```shell
POST /end-point-path/ HTTP/1.1
HOST: hostname:port
X-HTTP-Method-Override: DELETE
```

Responses:

Success:
```shell
Status: 200
Content-Type: application/json; charset=utf-8

{}
```

Other responses:
 - 404 - Document was not found (or doesn't exist)
 - 405 - End-point is not supported

<a name="api_config"></a>

------------------------------------------------------------------
### API Configuration

**merest** supports range of options to expose Mongoose models.
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

### Supported API options:

#### Options to control API end-points:
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

#### End-point configuration options:
- **path**: `String` - `additional-path` of end-point
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

<a name="methods_api"></a>

-------------------------------------------------------------------------
### Options for model methods exposition
- expose: `Object` - configuration for end-points that expose the instance methods defined on its schema
- exposeStatic: `Object` - configuration for end-points that expose static model methods defined on its schema.

The keys of these options are names of the Model methods (instance or static).
The each value of the key could be on of types: `Boolean`|`String`|`Object`

```javascript
{
  expose: {
    methodName: `Boolean` | `String` | `Object`,
    methodName: `Boolean` | `String` | `Object`
    ...
  },
  exposeStatic: {
    methodName: `String` | `Object`,
    ...
  }
}
```

In case of `Boolean` the value means if method-end-point is allowed (`true`) or is disabled (`false`).
There is a special key `"*"` that allows to enable or to disable all methods together.
```javascript
{
  expose: {'*': true} // all instance method will be exposed
}
```

In case of `String` **merest** mounts controller that calls correspondent method
to the HTTP-method specified by value (if value is on of Express-supported HTTP-methods).

Otherwise (the value is not a HTTP-method) **merest** mounts appropriate controller
to POST (or other method specified directly) and adds created method-end-point
to list with value as description.

In case of `Object` **merest** uses the value to configure method-end-point.

#### Method-end-point configuration options:
 - **method**:`String` - the HTTP method to mount method-end-point (if omitted the method-controller will be mount on the POST)
 - **path**: `String` - the `additional-path` to mount method-controller
 - **exec**:`Function` - the Function that will be called instead of Model instance/static
method with context of Document or the Model. You could to call any Model method from this
function using `this`.
 - **middlewares**: `Function|Array` - middleware function or array of such functions. The middleware(s) will be mounted to the method-end-point route as usual express middleware
 - **title**: `String` - the description of the end-point

#### Signature of Model method that can be exposed
The controller that calls certain Model method passes to the one two parameters:
  - **options** - parameters sent from client (in the Query String or in Request
    Body dependent on the HTTP method used to mount method-end-point)
  - **callback** - Function that should be called after method processed.

**Signature of callback-function**:
```javascript

/**
 * @param  {Error} err                        exception raised in the method call
 * @param  {Object|Array|String} dataToReturn The data to be return in Response Body
 */
function callback(err, dataToReturn) {
  ...
}
```

```javascript
VectorSchema.methods.reverse = function(options, callback) {
  this.x = -this.x;
  this.y = -this.y;
  return this.save(callback);
}
```
or in case of `statics`:
```javascript
VectorSchema.statics.reverse = function(options, callback) {
  var self = this;
  self.update({}, {$mul: {x:-1, y:-1} }, {multi: true}, function (err) {
    if (err) return done(err);
    return self.find(callback);
  });
}
```

Exposing the method
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, { // Model-routes level
  fields: 'x y',
  expose: {
    reverse: 'get'
  }
});
```

--------------------------------------------------
Getting the vector details:
```shell
curl -g http://localhost:1337/api/v1/vectors/573f19d35b54089f3993605f/
```
Output:
```shell
{"_id": "573f19d35b54089f3993605f", "x": 1, "y": 2}
```

--------------------------------------------------
Calling method-end-point:
```shell
curl -g http://localhost:1337/api/v1/vectors/573f19d35b54089f3993605f/reverse
```
Output:
```shell
{"__v": 1, "_id": "573f19d35b54089f3993605f", "x": -1, "y": -2, "info": {"tags": []}}
```

--------------------------------------------------
Getting the vector details again:
```shell
curl -g http://localhost:1337/api/v1/vectors/573f19d35b54089f3993605f/
```
Output:
```shell
{"_id": "573f19d35b54089f3993605f", "x": -1, "y": -2}
```

Lookout the **merest** doesn't clean the response from exposed methods.
So, you should do it by your own code.

<a name="to-do"></a>

-------------------------------------------------------------------------------
### To do:
 - extend Cook-book
 - add `transformResponse` option
 - extend query support for method GET (`field__gt`, `field__ne`, `field__in` etc.)
 - extend `options` controller with supporting **swagger**
 - extend `options` controller with supporting **blueprint**
