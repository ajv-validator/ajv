'use strict';

//all requires must be explicit because browserify won't work with dynamic requires
module.exports = {
  '$ref': require('../dotjs/ref'),
  anyOf: require('../dotjs/anyOf'),
  format: require('../dotjs/format'),
  maxLength: require('../dotjs/maxLength'),
  minItems: require('../dotjs/minItems'),
  minimum: require('../dotjs/minimum'),
  oneOf: require('../dotjs/oneOf'),
  required: require('../dotjs/required'),
  dependencies: require('../dotjs/dependencies'),
  items: require('../dotjs/items'),
  maxProperties: require('../dotjs/maxProperties'),
  minLength: require('../dotjs/minLength'),
  multipleOf: require('../dotjs/multipleOf'),
  pattern: require('../dotjs/pattern'),
  uniqueItems: require('../dotjs/uniqueItems'),
  allOf: require('../dotjs/allOf'),
  enum: require('../dotjs/enum'),
  maxItems: require('../dotjs/maxItems'),
  maximum: require('../dotjs/maximum'),
  minProperties: require('../dotjs/minProperties'),
  not: require('../dotjs/not'),
  properties: require('../dotjs/properties'),
  validate: require('../dotjs/validate')
};
