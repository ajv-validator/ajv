import {Vocabulary} from "../../types"

const applicator: Vocabulary = [
  require("./allOf"),
  require("./anyOf"),
  require("./items"),
  require("./contains"),
]

module.exports = applicator
