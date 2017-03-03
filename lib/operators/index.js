'use strict';

const OPERATORS = [
  'eq', 'ne',
  'lt', 'lte',
  'gt', 'gte',
  'in', 'nin',
  'ex',
  're'
]

const allOperators = OPERATORS.reduce( (o, k) => (o[k] = k) && o, { });

const operatorsMap = Object.assign(
  allOperators, {
  '=': 'eq',
  '!=': 'ne',
  '!eq': 'ne',
  '<': 'lt',
  '!>=': 'lt',
  '<=': 'lte',
  '!>': 'lte',
  '>': 'gt',
  '!<=': 'gt',
  '>=': 'gte',
  '!<': 'gte',
  '*': 'in',
  '!*': 'nin',
  '!in': 'nin',
  '+': 'ex',
  '/': 're'
});

function map(val) {
  if (typeof val === 'string') val = val.split(/[\s,;]+/);
  if (!Array.isArray(val)) {
    if (typeof val !== 'object') return {};
    val = Object.keys(val).filter(v => val[v]);
  }
  return val.reduce( (l, o) => (l[operatorsMap[o]] = true) && l, {} );
}

function union() {
  let u = { };
  for (let i in arguments) u = Object.assign(u, arguments[i]);
  return u;
}

function exclude() {
  let obj = arguments[0];
  let l = arguments.length;
  for (let i=1; i<l; i++) {
    let e = arguments[i];
    if (typeof e === 'string') delete obj[e];
    if (typeof e === 'object' && !Array.isArray(e)) e = Object.keys(e);
    if (Array.isArray(e)) e.forEach( ee => delete obj[ee] )
  }
  return obj;
};

module.exports = exports = {
  map: map,
  operatorsMap: operatorsMap,
  all: map(OPERATORS),
  fixed: map('= != * !* +'),
  strict: map('='),
  bool: map('= +'),
  u: union,
  union: union,
  e: exclude,
  exclude: exclude
}
