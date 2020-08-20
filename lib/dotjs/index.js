"use strict"

//all requires must be explicit because browserify won't work with dynamic requires
module.exports = {
  $ref: require("./ref"),
  dependencies: require("./dependencies"),
  format: require("./format"),
  if: require("./if"),
  properties: require("./properties"),
  propertyNames: require("./propertyNames"),
  required: require("./required"),
}
