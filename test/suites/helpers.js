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

  it ('should exclude some paths', function() {
    var obj = {
      x: '1',
      y: 2,
      z: {
        a: 1,
        b: {
          c: 2
        },
        t: {
          a: 7,
          b: 8,
          c: 9
        }
      }
    };
    var exclude = {
      'z.a': true,
      y: true,
      'z.t': true

    }
    assert.deepEqual(helpers.flat(obj, exclude), {
      x: 1,
      'z.b.c': 2
    });
  });

});

describe('normalizeReadonly', function() {

  it('should process string parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly('a b c'),
      { a: true, b: true, c: true }
    )
  });

  it('should process array parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly(['a', 'b', 'c']),
      { a: true, b: true, c: true }
    )
  });

  it('should process object parameter', function() {
    assert.deepEqual(
      helpers.normalizeReadonly({ a: true, b: true, c: true }),
      { a: true, b: true, c: true }
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

  it('should return other default value if it is assigned and undefined passed', function() {
    assert.deepEqual(
      helpers.normalizeReadonly(undefined, { _id: true }),
      { _id: true }
    );
  });

  it('should return other default value if it is assigned and empty array passed', function() {
    assert.deepEqual(
      helpers.normalizeReadonly([], { _id: true }),
      { _id: true }
    );
  });

  it('should return other default value if it is assigned and number, true or date passed', function() {
    assert.deepEqual(
      helpers.normalizeReadonly(2, { _id: true }),
      { _id: true }
    );

    assert.deepEqual(
      helpers.normalizeReadonly(true, { _id: true }),
      { _id: true }
    );

    assert.deepEqual(
      helpers.normalizeReadonly(new Date('2017-01-01'), { _id: true }),
      { _id: true }
    );
  });



});
