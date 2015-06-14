'use strict';

var fs = require('fs')
  , doT = require('dot')
  , util = require('../util');

var defs = fs.readFileSync(__dirname + '/definitions.def.js');

var RULES = module.exports = [
  { type: 'number',
    rules: [ 'maximum', 'minimum', 'multipleOf'] },
  { type: 'string',
    rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
  { type: 'array',
    rules: [ 'maxItems', 'minItems', 'uniqueItems', 'items' ] },
  { type: 'object',
    rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'properties' ] },
  { rules: [ '$ref', 'enum', 'not', 'anyOf', 'oneOf', 'allOf' ] }
];

RULES.defs = defs;
RULES.all = [ 'type', 'additionalProperties', 'patternProperties' ];

RULES.forEach(function (group) {
  group.rules = group.rules.map(function (keyword) {
    RULES.all.push(keyword);
    var template = fs.readFileSync(__dirname + '/' + keyword + '.dot.js');
    return {
      keyword: keyword,
      code: doT.compile(template, { definitions: defs })
    };
  });
});

RULES.all = util.toHash(RULES.all);
