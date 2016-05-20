#### Read only exposition

If you need to expose Model only for reading you have to disable `create`,
`update` and `delete` end-points.

```javascript
var api = new merest.ModelAPIExpress();
api.expose(models.Vector, {
  create: false,
  update: false,
  delete: false
});
```
----------------------------------------------
Running example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/read-only/server
```
Output:
```shell
Express server listening on port 1337
```
--------------------------------------------------
Getting options:
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
-------------------------------------------------
Trying to add new vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vectors
```

Output:
```shell
{"error": true, "code": 405, "message": "Not Supported"}
```
