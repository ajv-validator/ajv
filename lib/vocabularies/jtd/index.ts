import type {Vocabulary} from "../../types"
// import definitions from "./definitions"
import refKeyword from "./ref"
import typeKeyword from "./type"
import enumKeyword from "./enum"
import elements from "./elements"
import properties from "./properties"
import optionalProperties from "./optionalProperties"
import discriminator from "./discriminator"
import values from "./values"
import union from "./union"

const jtdVocabulary: Vocabulary = [
  "definitions",
  refKeyword,
  typeKeyword,
  enumKeyword,
  elements,
  properties,
  optionalProperties,
  discriminator,
  values,
  union,
  {keyword: "additionalProperties", schemaType: "boolean"},
  {keyword: "nullable", schemaType: "boolean"},
  {keyword: "metadata", schemaType: "object"},
]

export default jtdVocabulary
