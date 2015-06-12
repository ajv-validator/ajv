'use strict';

var fs = require('fs')
  , doT = require('dot');

var defs = fs.readFileSync(__dirname + '/definitions.def.js');

var RULES = module.exports = [
  { type: 'number',
    rules: [ 'maximum', 'minimum', 'multipleOf'] },
  { type: 'string',
    rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
  { type: 'array',
    rules: [ 'maxItems', 'minItems', 'uniqueItems', 'items' ] },
  { type: 'object',
    rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'properties'  ] },
  { rules: [ '$ref', 'enum', 'not', 'anyOf', 'oneOf', 'allOf' ] }
];

RULES.hash = { type: true };

RULES.forEach(function (group) {
  group.rules = group.rules.map(function (keyword) {
    RULES.hash[keyword] = true;
    var template = fs.readFileSync(__dirname + '/' + keyword + '.dot.js');
    return {
      keyword: keyword,
      code: doT.compile(template, { definitions: defs })
    };
  });
});


RULES.defs = defs;

