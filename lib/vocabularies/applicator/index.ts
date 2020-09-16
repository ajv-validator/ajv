import type {Vocabulary} from "../../types"
import additionalItems from "./additionalItems"
import items from "./items"
import contains from "./contains"
import dependencies from "./dependencies"
import propertyNames from "./propertyNames"
import additionalProperties from "./additionalProperties"
import properties from "./properties"
import patternProperties from "./patternProperties"
import notKeyword from "./not"
import anyOf from "./anyOf"
import oneOf from "./oneOf"
import allOf from "./allOf"
import ifKeyword from "./if"
import thenElse from "./thenElse"

const applicator: Vocabulary = [
  // array
  additionalItems,
  items,
  contains,
  // object
  dependencies,
  propertyNames,
  additionalProperties,
  properties,
  patternProperties,
  // any
  notKeyword,
  anyOf,
  oneOf,
  allOf,
  ifKeyword,
  thenElse,
]

export default applicator
