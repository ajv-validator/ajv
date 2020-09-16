import type {Vocabulary} from "../../types"
import limit from "./limit"
import multipleOf from "./multipleOf"
import limitLength from "./limitLength"
import pattern from "./pattern"
import limitProperties from "./limitProperties"
import required from "./required"
import limitItems from "./limitItems"
import uniqueItems from "./uniqueItems"
import constKeyword from "./const"
import enumKeyword from "./enum"

const validation: Vocabulary = [
  // number
  limit,
  multipleOf,
  // string
  limitLength,
  pattern,
  // object
  limitProperties,
  required,
  // array
  limitItems,
  uniqueItems,
  // any
  {keyword: "nullable", schemaType: "boolean"},
  constKeyword,
  enumKeyword,
]

export default validation
