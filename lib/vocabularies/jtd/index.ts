import type {Vocabulary} from "../../types"
import typeKeyword from "./type"
import enumKeyword from "./enum"
import elements from "./elements"
import properties from "./properties"
import optionalProperties from "./optionalProperties"

const jtdVocabulary: Vocabulary = [
  typeKeyword,
  enumKeyword,
  elements,
  properties,
  optionalProperties,
]

export default jtdVocabulary
