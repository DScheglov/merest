'use strict';

const assert = require('assert');
const op = require('../../lib/operators');

describe('operators.map', function () {

  it('should map string to the set', function () {
    assert.deepEqual(op.map('= !='), {
      'eq': true,
      'ne': true
    });
  });

  it('should map array to the set', function () {
    assert.deepEqual(op.map(['=', '!=']), {
      'eq': true,
      'ne': true
    });
  });

  it('should process ready set', function () {
    assert.deepEqual(op.map({
      '=': true, '!=': true
    }), {
      'eq': true,
      'ne': true
    })
  });

  it ('should return {} if passed not a string', function() {
    assert.deepEqual(op.map(1), {});
    assert.deepEqual(op.map(true), {});
    assert.deepEqual(op.map(), {});
  });

});

describe('operators.union', function () {

  it('should union two objects', function () {

    assert.deepEqual(
      op.union({ a: 1 }, { b: 2 }), {
        a: 1, b: 2
      }
    )

  })

});


describe('operators.exclude', function () {

  it('should exclude items from first object', function () {

    assert.deepEqual(
      op.exclude( {
        a: 1, b: 2, c: 3, d: 4, e: 5, g: 6
      }, 'b', ['c', 'd'], { e: true, g: false }), {
        a: 1
      }
    )

  });

  it('should exclude re from all', function () {
    assert.deepEqual(
      op.exclude(op.all, op.map('/')), {
        eq: true,
        ne: true,
        lt: true,
        lte: true,
        gt: true,
        gte: true,
        in: true,
        nin: true,
        ex: true
      });
    });

});
