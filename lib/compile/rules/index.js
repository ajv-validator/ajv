'use strict';

var fs = require('fs')
  , doT = require('dot');


var RULES = module.exports = [
  { type: 'number',
    inline: [ 'maximum', 'minimum', 'multipleOf'] },
  { type: 'string',
    inline: [ 'maxLength', 'minLength', 'pattern', 'format' ] },
  { type: 'array',
    inline: [ 'maxItems', 'minItems' ],
    func: [ 'items', 'uniqueItems' ] },
  { type: 'object',
    inline: [ 'maxProperties', 'minProperties', 'required' ],
    func: [ 'dependencies', 'properties' ] },
  { inline: [ 'type' ],
    func: [ '$ref', 'enum', 'not', 'anyOf', 'oneOf', 'allOf' ] }
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



// {



//     type:  { code: fs.readFileSync(__dirname + '/type.dot.js'), inline: true, order: 10 },
//     enum:  { code: fs.readFileSync(__dirname + '/enum.dot.js'), order: 80 },
//     allOf: { code: fs.readFileSync(__dirname + '/allOf.dot.js'), order: 110 },
//     anyOf: { code: fs.readFileSync(__dirname + '/anyOf.dot.js'), order: 100 },
//     oneOf: { code: fs.readFileSync(__dirname + '/oneOf.dot.js'), order: 110 },
//     not:   { code: fs.readFileSync(__dirname + '/not.dot.js'), order: 90 },
//     maximum: { // includes exclusiveMaximum
//         code: fs.readFileSync(__dirname + '/maximum.dot.js'),
//         type: 'number',
//         inline: true,
//         order: 20
//     },
//     minimum: { // includes exclusiveMinimum
//         code: fs.readFileSync(__dirname + '/minimum.dot.js'),
//         type: 'number',
//         inline: true,
//         order: 20
//     },
//     multipleOf: {
//         code: fs.readFileSync(__dirname + '/multipleOf.dot.js'),
//         type: 'number',
//         inline: true,
//         order: 40
//     },
//     maxLength: {
//         code: fs.readFileSync(__dirname + '/maxLength.dot.js'),
//         type: 'string',
//         inline: true,
//         order: 50
//     },
//     minLength: {
//         code: fs.readFileSync(__dirname + '/minLength.dot.js'),
//         type: 'string',
//         inline: true,
//         order: 50
//     },
//     pattern: {
//         code: fs.readFileSync(__dirname + '/pattern.dot.js'),
//         type: 'string',
//         inline: true,
//         order: 60
//     },
//     format: {
//         code: fs.readFileSync(__dirname + '/format.dot.js'),
//         type: 'string',
//         inline: true,
//         order: 70
//     },
//     items: { // includes additionalItems
//         code: fs.readFileSync(__dirname + '/items.dot.js'),
//         type: 'array',
//         order: 120
//     },
//     maxItems: {
//         code: fs.readFileSync(__dirname + '/maxItems.dot.js'),
//         type: 'array',
//         inline: true,
//         order: 20
//     },
//     minItems: {
//         code: fs.readFileSync(__dirname + '/minItems.dot.js'),
//         type: 'array',
//         inline: true,
//         order: 20
//     },
//     uniqueItems: {
//         code: fs.readFileSync(__dirname + '/uniqueItems.dot.js'),
//         type: 'array',
//         order: 110
//     },
//     maxProperties: {
//         code: fs.readFileSync(__dirname + '/maxProperties.dot.js'),
//         type: 'object',
//         inline: true,
//         order: 30
//     },
//     minProperties: {
//         code: fs.readFileSync(__dirname + '/minProperties.dot.js'),
//         type: 'object',
//         inline: true,
//         order: 30
//     },
//     required: {
//         code: fs.readFileSync(__dirname + '/required.dot.js'),
//         type: 'object',
//         inline: true,
//         order: 80
//     },
//     properties: { // includes patternProperties and additionalProperties
//         code: fs.readFileSync(__dirname + '/properties.dot.js'),
//         type: 'object',
//         order: 130
//     },
//     dependencies: {
//         code: fs.readFileSync(__dirname + '/dependencies.dot.js'),
//         type: 'object',
//         order: 140
//     },
//     $ref: {
//         code: fs.readFileSync(__dirname + '/$ref.dot.js'),
//         order: 150  
//     }
// };
