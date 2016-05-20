##### Exposition of static method

**merest** allows you to expose static Model method so simple as instance method.

`model.js` updates:
```javascript
VectorSchema.statics.reverse = function(options, done) {
  var self = this;
  self.update(options, {$mul: {x:-1, y:-1} }, {multi: true}, function (err) {
    if (err) return done(err);
    return self.find(options, done);
  });
}
```

Updating `api.js`:
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  fields: 'x y',
  exposeStatic: {
    reverse: 'get' // mounting controller to the GET
  }
});
```

In this example we will use the fixtures (`fixtures.js`):
```javascript
module.exports = exports = [
  {x: 1, y: 2},
  {x: 0, y: 3}
]
```

----------------------------------------------
Running example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/static-method/server
```
Output:
```shell
Express server is listening on port 1337
```

----------------------------------------------
Getting API-options:
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
  ["get", "/api/v1/vectors/reverse", "Vector.statics.reverse"],
  ["get", "/api/v1/vectors/:id", "Find a Vector by Id"],
  ["post", "/api/v1/vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vectors/:id", "Find a Vector by Id and delete it."]
]
```

----------------------------------------------
Listing all vectors:
```shell
curl -g http://localhost:1337/api/v1/vectors
```
Output:
```shell
[
  {"_id": "...", "x":1, "y": 2},
  {"_id": "...", "x":0, "y": 3}
]
```

--------------------------------------------------
Calling method-end-point:
```shell
curl -g http://localhost:1337/api/v1/vectors/reverse
```
Output:
```shell
[
  {"_id": "...", "x": -1,"y": -2,"info": {"tags": []}},
  {"_id": "...", "x": 0,"y": -3,"info": {"tags": []}}
]
```
Lookout the **merest** doesn't clean the response from exposed methods.
So, you should do it by your own code.

--------------------------------------------------
Getting the vectors again:
```shell
curl -g http://localhost:1337/api/v1/vectors/
```
Output:
```shell
[
  {"_id": "573f423c0443c93a40d2eebb", "x": -1,"y": -2},
  {"_id": "573f423c0443c93a40d2eebc", "x": 0,"y": -3}
]
```

The method implementations allows us to reverse only subset of vectors,
specifying query on method-end-point request:

--------------------------------------------------
Reversing only vertical vectors (call this URL after all previous cases):
```shell
curl -g http://localhost:1337/api/v1/vectors/reverse?x=0
```
Output:
```shell
[
  {"_id": "...", "x": 0,"y": 3,"info": {"tags": []}}
]
```
