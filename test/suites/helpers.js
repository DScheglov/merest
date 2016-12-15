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

})
