'use strict';

var fs = require('fs')
  , doT = require('dot');


var RULES = module.exports = [
  { type: 'number',
    rules: [ 'maximum', 'minimum', 'multipleOf'] },
  { type: 'string',
    rules: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
  { type: 'array',
    rules: [ 'maxItems', 'minItems', 'uniqueItems', 'items' ] },
  { type: 'object',
    rules: [ 'maxProperties', 'minProperties', 'required', 'dependencies', 'properties'  ] },
  { rules: [ '$ref', 'type', 'enum', 'not', 'anyOf', 'oneOf', 'allOf' ] }
];


RULES.forEach(function (group) {
  group.rules = group.rules.map(function (keyword) {
    var template = fs.readFileSync(__dirname + '/' + keyword + '.dot.js');
    return {
      keyword: keyword,
      code: doT.compile(template)
    };
  });
});
