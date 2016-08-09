### Response customization

`Merest` allows to customize all responses. In order to do that you should define
function that transforms prepared response and specify this function in api configuration

**Example**:
```javascript
// api.js

var api = new merest.ModelAPIExpress({
  transformResponse: prepareResponse
});

...

function prepareResponse(req, res) {
  var body = {
    status: this.status,
    data: this.body
  };
  this.status = 200;
  this.body = body;
}


```

You could access the following fields inside a transforming function:
 - `this.status` -- the HTTP Status
 - `this.body` -- the response body
 - `this.apiMethod` -- the API end-point name (`create`, `search`, `details` etc.)
 - `this.apiInstanceMethod` -- the name of exposed instance method
 - `this.apiStaticMethod` -- the name of exposed static method
 - `this.api` -- the API-object (the child of `express`);
 - `this.modelAPI` -- the router dispatches end-points related the model
 - `this.model` -- the model name

 You should reassign `this.status` and `this.body` to override default HTTP-response.
 The function returns nothing.

 Calling API:
```shell
curl -X OPTIONS http://localhost:1337/api/v1/
```
Output:
```shell
{
  "status": 200,
  "data": [
    ["options", "/api/v1/", "List all end-points of current application"],
    ["options", "/api/v1/vectors/", "List API-options for vectors"],
    ["get", "/api/v1/vectors/", "List/Search all vectors"],
    ["post", "/api/v1/vectors/", "Create a new Vector"],
    ["get", "/api/v1/vectors/:id", "Find a Vector by Id"],
    ["post", "/api/v1/vectors/:id", "Find a Vector by Id and update it (particulary)"],
    ["delete", "/api/v1/vectors/:id", "Find a Vector by Id and delete it."]
  ]
}
```

Also you can run this example:
```shell
git clone https://github.com/DScheglov/merest.git
cd merest
npm install
node examples/transform-response/server.js
```
