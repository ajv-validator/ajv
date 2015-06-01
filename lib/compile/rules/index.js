'use strict';

var fs = require('fs')
  , doT = require('dot');


var RULES = module.exports = [
  { type: 'number',
    inline: [ 'maximum', 'minimum', 'multipleOf'] },
  { type: 'string',
    inline: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
  { type: 'array',
    inline: [ 'maxItems', 'minItems', 'uniqueItems' ],
    func: [ 'items' ] },
  { type: 'object',
    inline: [ 'maxProperties', 'minProperties', 'required', 'properties'  ],
    func: [ 'dependencies' ] },
  { inline: [ '$ref', 'type', 'enum', 'not', 'anyOf', 'oneOf', 'allOf' ] }
];


RULES.forEach(function (group) {
  group.rules = [];
  addRules('inline', true);
  addRules('func');

  function addRules(mode, isInline) {
    var keywords = group[mode];
    if (keywords) keywords.forEach(function (keyword) {
      var template = fs.readFileSync(__dirname + '/' + keyword + '.dot.js');
      group.rules.push({
        keyword: keyword,
        code: doT.compile(template),
        inline: isInline
      });
    });
  }
});
