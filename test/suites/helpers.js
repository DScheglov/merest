'use strict';

var assert = require('assert');
var helpers = require('../../lib/helpers');

describe('parseRegExp()', function() {

  it ('should return regexp for \'/read/i\'', function() {

    var re = helpers.parseRegExp('/read/i');
    assert.ok(re instanceof RegExp);
    assert.equal(re.toString(), '/read/i');

  });

  it ('should return regexp for \'read\'', function() {

    var re = helpers.parseRegExp('read');
    assert.ok(re instanceof RegExp);
    assert.equal(re.toString(), '/read/');

  });

  it ('should return regexp for \'/[^\\/]/\'', function() {

    var re = helpers.parseRegExp('/[^\\/]/');
    assert.ok(re instanceof RegExp);
    assert.equal(re.toString(), '/[^\\/]/');

  });

  it ('should return the same value as for \'/[/\'', function() {

    var re = helpers.parseRegExp('/[/');
    assert.ok(!(re instanceof RegExp));
    assert.equal(re.toString(), '/[/');

  });

});

describe('flat()', function () {

  it('should return the same object if no embeded arrays or objects', function(){

    var obj = {
      x: '1',
      y: 2
    };
    assert.deepEqual(helpers.flat(obj), obj);

  });

  it('should return the .-separated fields if object contains embeded objects', function(){

    var obj = {
      x: '1',
      y: 2,
      z: {
        a: 1,
        b: {
          c: 2
        }
      }
    };
    assert.deepEqual(helpers.flat(obj), {
      x: '1',
      y: 2,
      'z.a': 1,
      'z.b.c': 2
    });

  });

  it ('should keep embedded array witout changes', function() {
    var obj = {
      x: '1',
      y: 2,
      a: [1, 2, 3]
    };
    assert.deepEqual(helpers.flat(obj), obj);
  });

});

describe('normalizeReadonly', function() {

  it('should process string parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly('a b! c'),
      [
        { name: 'a', path: /^a$/, strict: false, message: null },
        {
          name: 'b', path: /^b$/, strict: true,
          message: 'Couldn\'t modify path <b>'
        },
        { name: 'c', path: /^c$/, strict: false, message: null }
      ]
    )
  });

  it('should process array parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly(['a', 'b!', 'c']),
      [
        { name: 'a', path: /^a$/, strict: false, message: null },
        {
          name: 'b', path: /^b$/, strict: true,
          message: 'Couldn\'t modify path <b>'
        },
        { name: 'c', path: /^c$/, strict: false, message: null }
      ]
    )
  });

  it('should process object parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly({ a: true, 'b!': true, c: true }),
      [
        { name: 'a', path: /^a$/, strict: false, message: null },
        {
          name: 'b', path: /^b$/, strict: true,
          message: 'Couldn\'t modify path <b>'
        },
        { name: 'c', path: /^c$/, strict: false, message: null }
      ]
    )
  });

  it('should process object parameter with false and string values', function() {
    assert.deepEqual(
      helpers.normalizeReadonly({
        a: true,
        'b!': false,
        c: 'Don\'t touch c' }),
      [
        { name: 'a', path: /^a$/, strict: false, message: null },
        { name: 'c', path: /^c$/, strict: false, message: 'Don\'t touch c' }
      ]
    )
  });

  it('should return null if no parameter passed', function() {
    assert.equal(
      helpers.normalizeReadonly(),
      null
    )
  });

  it('should return null if passed empty string', function() {
    assert.equal(
      helpers.normalizeReadonly(''),
      null
    )
  });

  it('should return null if passed empty array', function() {
    assert.equal(
      helpers.normalizeReadonly([]),
      null
    )
  });

  it('should return other default value if it is assigned and number, true or date passed', function() {
    assert.deepEqual(
      helpers.normalizeReadonly(2),
      null
    );

    assert.deepEqual(
      helpers.normalizeReadonly(true),
      null
    );

    assert.deepEqual(
      helpers.normalizeReadonly(new Date('2017-01-01')),
      null
    );
  });

  it('should process string parameter with templated path', function() {
    assert.deepEqual(
      helpers.normalizeReadonly('a b! **._id t.*.a!'),
      [
        {
          name: 'a', path: /^a$/, strict: false, message: null
        }, {
          name: 'b', path: /^b$/, strict: true,
          message: 'Couldn\'t modify path <b>'
        }, {
          name: '**._id',
          path: /^([^.]+\.?)*\._id$/,
          strict: false,
          message: null
        }, {
          name: 't.*.a',
          path: /^t\.[^.]+\.a$/,
          strict: true,
          message: 'Couldn\'t modify path <t.*.a>'
        }
      ]
    )
  });

});

describe('validateReadonly', function() {

  it('should return flatted data for empty rules list', function () {
    let data = {
      a: 1,
      b: {s: '232'}
    };
    assert.deepEqual(
      helpers.validateReadonly(helpers.flat(data), []),
      helpers.flat(data)
    );
  });

  it('should exculde non-strictly frozed fields', function () {
    let data = helpers.flat({
      a: 1,
      b: {s: '232', c: 'c'}
    });
    let rules = helpers.normalizeReadonly('b.c')
    assert.deepEqual(
      helpers.validateReadonly(data, rules),
      { a: 1, 'b.s': '232'}
    );
  });

  it('should throw ModelAPIError if object contains _id fields', function () {
    let data = helpers.flat({
      _id: 1,
      b: {
        _id: 1,
      },
      c: {
        t: { _id: 2 }
      }
    });
    let rules = helpers.normalizeReadonly('_id! **._id!')
    assert.throws(
      () => helpers.validateReadonly(data, rules),
      (err) => {
        assert.deepEqual(err, {
          message: 'Readonly constraint vialated',
          code: 422,
          errors: {
            _id: {
              type: 'readonly',
              message: 'Couldn\'t modify path <_id>',
              path: '_id'
            },
            'b._id': {
              type: 'readonly',
              message: 'Couldn\'t modify path <**._id>',
              path: 'b._id'
            },
            'c.t._id': {
              type: 'readonly',
              message: 'Couldn\'t modify path <**._id>',
              path: 'c.t._id'
            }
          }
        })
        return true;
      }
    );
  });

  it('should throw ModelAPIError if object contains _id (*) fields', function () {
    let data = helpers.flat({
      _id: 1,
      b: {
        _id: 1,
      },
      c: {
        t: { _id: 2 },
        d: {
          t : { _id: 3 }
        }
      }
    });
    let rules = helpers.normalizeReadonly('_id c.*._id!')
    assert.throws(
      () => helpers.validateReadonly(data, rules),
      (err) => {
        assert.deepEqual(err, {
          message: 'Readonly constraint vialated',
          code: 422,
          errors: {
            'c.t._id': {
              type: 'readonly',
              message: 'Couldn\'t modify path <c.*._id>',
              path: 'c.t._id'
            }
          }
        })
        return true;
      }
    );
  });

});
