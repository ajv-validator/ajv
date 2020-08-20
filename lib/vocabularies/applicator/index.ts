import {Vocabulary} from "../../types"

const applicator: Vocabulary = [
  // array
  require("./items"),
  require("./contains"),
  // any
  require("./not"),
  require("./anyOf"),
  require("./oneOf"),
  require("./allOf"),
  // TODO require("./if"),
]

module.exports = applicator
