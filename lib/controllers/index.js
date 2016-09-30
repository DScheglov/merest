
module.exports = exports = {
  options: require('./options'),
  find: require('./find-by-id'),
  create: require('./create'),
  update: require('./update'),
  delete: require('./del-by-id'),
  search: require('./search'),
  callInstanceMethod: require('./instance-method'),
  callStaticMethod: require('./static-method'),
  error: require('./error'),
  notSupported: require('./not-supported'),
  swagger: require('./swagger')
};
