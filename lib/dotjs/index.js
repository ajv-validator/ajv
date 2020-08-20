"use strict"

//all requires must be explicit because browserify won't work with dynamic requires
module.exports = {
  $ref: require("./ref"),
  dependencies: require("./dependencies"),
  format: require("./format"),
  properties: require("./properties"),
  propertyNames: require("./propertyNames"),
  required: require("./required"),
}
