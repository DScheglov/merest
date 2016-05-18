module.exports = exports = {
  isVerticalVector: isVerticalVector
}

function isVerticalVector(req, res, next) {
  if (req.body.x !== 0) {
    return next(new merest.ModelAPIError(422, 'The vector is not vertical'));
  }
  next();
}
