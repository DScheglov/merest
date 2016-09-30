var swig = require('swig');
var path = require('path')
var tmplPath = path.join(__dirname, '../templates/swagger.json');
var swaggerTmpl = swig.compileFile(tmplPath);

/**
 * swagger - controller that returns swagger.json content
 *
 * @param  {express.Request}  req        the http(s) request
 * @param  {express.Response} res        the http(s) response
 * @param  {Function}         next       the callback should be called if controller fails
 *
 * @memberof ModelAPIRouter
 */
function swagger(req, res) {
  try {
    res.__apiMethod = 'swagger.json';

    if (!this.__swagger) {
      var locals = {
        title: this.title,
        version: this.version,
        paths: this._paths,
        host: req.headers.host || "localhost"
      }
      if (this.mountpath) locals.basePath = this.mountpath;
      this.__swagger = swaggerTmpl(locals);

    }
    res.set('Content-Type', 'application/json');
    res.send(this.__swagger);
  } catch(e) {
    console.dir(e);
    res.send(e);
  }
}

module.exports = exports = swagger;
