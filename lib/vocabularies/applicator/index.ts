import {Vocabulary} from "../../types"

const applicator: Vocabulary = [
  // array
  require("./items"),
  require("./contains"),
  // object
  require("./dependencies"),
  require("./propertyNames"),
  // require("./properties"),
  require("./patternProperties"),
  // any
  require("./not"),
  require("./anyOf"),
  require("./oneOf"),
  require("./allOf"),
  require("./if"),
]

module.exports = applicator
