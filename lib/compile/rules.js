'use strict';

var ruleModules = require('./_rules')
  , util = require('./util');

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

RULES.all = [ 'type', 'additionalProperties', 'patternProperties' ];


RULES.forEach(function (group) {
  group.rules = group.rules.map(function (keyword) {
    RULES.all.push(keyword);
    return {
      keyword: keyword,
      code: ruleModules[keyword]
    };
  });
});

RULES.all = util.toHash(RULES.all);
