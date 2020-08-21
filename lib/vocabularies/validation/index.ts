import {Vocabulary} from "../../types"

const validation: Vocabulary = [
  // number
  require("./limit"),
  require("./multipleOf"),
  // string
  require("./limitLength"),
  require("./pattern"),
  // object
  require("./limitProperties"),
  // require("./required"),
  // array
  require("./limitItems"),
  require("./uniqueItems"),
  // any
  require("./const"),
  require("./enum"),
]

module.exports = validation
