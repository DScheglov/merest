##### Filtering on insertion

Before read this example please checkout the previous case:
 - [Exposition with filtering](https://github.com/DScheglov/merest/tree/master/examples/vertical-vectors)

This examples shows how to mitigate unwanted behaviour for inserting not vertical vector

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
Express server is listening on port 1337
```
----------------------------------------------
Posting new vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 0, "y": 777}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"x": 0, "y": 777}
```
----------------------------------------------
Posting not vertical vector
```shell
curl -H "Content-Type: application/json" -X POST -d '{"x": 7, "y": -123}' http://localhost:1337/api/v1/vertical-vectors
```
Output:
```shell
{"error": true, "code": 422, "message": "The vector is not vertical"}
```
