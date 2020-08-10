import {Vocabulary} from "../../types"

const validation: Vocabulary = [
  // number
  require("./limit"),
  require("./multipleOf"),
  // string
  require("./limitLength"),
  // object
  require("./limitProperties"),
  // array
  require("./limitItems"),
  // any
  require("./const"),
]

module.exports = validation
