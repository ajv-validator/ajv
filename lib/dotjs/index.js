"use strict"

//all requires must be explicit because browserify won't work with dynamic requires
module.exports = {
  $ref: require("./ref"),
  allOf: require("./allOf"),
  anyOf: require("./anyOf"),
  $comment: require("./comment"),
  contains: require("./contains"),
  dependencies: require("./dependencies"),
  enum: require("./enum"),
  format: require("./format"),
  if: require("./if"),
  items: require("./items"),
  not: require("./not"),
  oneOf: require("./oneOf"),
  pattern: require("./pattern"),
  properties: require("./properties"),
  propertyNames: require("./propertyNames"),
  required: require("./required"),
  uniqueItems: require("./uniqueItems"),
  validate: require("./validate"),
}
