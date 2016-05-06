

/**
 * @class ModelAPIError - extends Error
 *
 * @param  {Number|String}  code    the code should be transfered as HTTP-response code
 * @param  {String|Error}   message the description of error
 * @return {ModelAPIError}          the ModelAPIError
 */
function ModelAPIError(code, message) {
  var err;
  if (message instanceof Error) err = message;
  else err = new Error(message);
  err.__proto__ = ModelAPIError.prototype;
  Object.defineProperty(err, 'code', {
    enumerable: true,
    value: code,
    writeable: false
  });
  if (typeof message === 'string') {
    Object.defineProperty(err, 'message', {
      enumerable: true,
      value: message,
      writeable: false
    });
  }
  return err;
};

ModelAPIError.prototype = Object.create(Error.prototype);
ModelAPIError.prototype.constructor = ModelAPIError;
ModelAPIError.prototype.name = 'ModelAPIError';

module.exports = exports = ModelAPIError;
