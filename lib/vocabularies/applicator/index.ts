import {Vocabulary} from "../../types"

const applicator: Vocabulary = [
  // array
  require("./items"),
  require("./contains"),
  // object
  // require("./required"),
  require("./dependencies"),
  require("./propertyNames"),
  // require("./properties"),
  // any
  require("./not"),
  require("./anyOf"),
  require("./oneOf"),
  require("./allOf"),
  require("./if"),
]

module.exports = applicator
