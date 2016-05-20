##### Exposition with filtering

Sometimes we need to restrict exposed subset with documents that satisfy certain
criteria. For our examples let it be: Expose only vertical vectors.

The criteria for vertical vectors is very simple: `{x: 0}`.

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
----------------------------------------------
Running example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/vertical-vectors/server
```
Output:
```shell
Express server listening on port 1337
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
  ["options", "/api/v1/vertical-vectors/", "List API-options for vectors"],
  ["get", "/api/v1/vertical-vectors/", "List/Search all vectors"],
  ["post", "/api/v1/vertical-vectors/", "Create a new Vector"],
  ["get", "/api/v1/vertical-vectors/:id", "Find a Vector by Id"],
  ["post", "/api/v1/vertical-vectors/:id", "Find a Vector by Id and update it (particulary)"],
  ["delete", "/api/v1/vertical-vectors/:id", "Find a Vector by Id and delete it."]
]
```

----------------------------------------------
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

----------------------------------------------
Posting new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"x": 0, "y": 777, "__v": 0, "info": {"tags":[]}}
```

----------------------------------------------s
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
