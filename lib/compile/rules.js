'use strict';

var ruleModules = require('./_rules')
  , util = require('./util');

module.exports = function rules() {
  var RULES = [
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
  RULES.keywords = [ 'additionalItems', '$schema', 'id', 'title', 'description', 'default' ];
  RULES.types = [ 'number', 'integer', 'string', 'array', 'object', 'boolean', 'null' ];

  RULES.forEach(function (group) {
    group.rules = group.rules.map(function (keyword) {
      RULES.all.push(keyword);
      return {
        keyword: keyword,
        code: ruleModules[keyword]
      };
    });
  });

  RULES.keywords = util.toHash(RULES.all.concat(RULES.keywords));
  RULES.all = util.toHash(RULES.all);
  RULES.types = util.toHash(RULES.types);

  return RULES;
};
