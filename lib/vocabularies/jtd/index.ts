import type {Vocabulary} from "../../types"
import typeKeyword from "./type"
import enumKeyword from "./enum"
import elements from "./elements"
import properties from "./properties"
import optionalProperties from "./optionalProperties"
import values from "./values"

const jtdVocabulary: Vocabulary = [
  typeKeyword,
  enumKeyword,
  elements,
  properties,
  optionalProperties,
  values,
]

export default jtdVocabulary
