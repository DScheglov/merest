##### Exposition of inctance method

Let's guess we need to call some model method from client side. For example
in our case with vectors we have method `reverse` that turn vector on 180 degrees.

So, update the `model.js` with adding code:
```javascript
VectorSchema.methods.reverse = function(options, callback) {
  this.x = -this.x;
  this.y = -this.y;
  return this.save(callback);
}
```

**merest** allows to expose this method in easy way -- just update `api.js`:
```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  fields: 'x y',
  expose: {
    reverse: 'get' // mounting controller to the GET
  }
});
```

In this example we will use the fixtures (`fixtures.js`):
```javascript
module.exports = exports = [
  {x: 1, y: 2, _id: ObjectId('573f19d35b54089f3993605f')},
  {x: 0, y: 3}
]
```

----------------------------------------------
Running example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/instance-method/server
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
  ["get", "/api/v1/vectors/:id", "Find a Vector by Id"],
  ["post", "/api/v1/vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vectors/:id", "Find a Vector by Id and delete it."],
  ["get", "/api/v1/vectors/:id/reverse", "Vector.reverse"]
```

----------------------------------------------
Listing all vertical vectors:
```shell
curl -g http://localhost:1337/api/v1/vectors
```
Output:
```shell
[
  {"_id": "573f19d35b54089f3993605f", "x":1, "y": 2},
  {"_id": "573f38e3bb647a173f0765d3", "x":0, "y": 3}]
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
Lookout the **merest** doesn't clean the response from exposed methods.
So, you should do it by your own code.

--------------------------------------------------
Getting the vector details:
```shell
curl -g http://localhost:1337/api/v1/vectors/573f19d35b54089f3993605f/
```
Output:
```shell
{"_id": "573f19d35b54089f3993605f", "x": -1, "y": -2}
```
