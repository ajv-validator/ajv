import type {ErrorObject, Vocabulary} from "../../types"
import additionalItems, {AdditionalItemsError} from "./additionalItems"
import items from "./items"
import contains, {ContainsError} from "./contains"
import dependencies, {DependenciesError} from "./dependencies"
import propertyNames, {PropertyNamesError} from "./propertyNames"
import additionalProperties, {AdditionalPropertiesError} from "./additionalProperties"
import properties from "./properties"
import patternProperties from "./patternProperties"
import notKeyword from "./not"
import anyOf from "./anyOf"
import oneOf, {OneOfError} from "./oneOf"
import allOf from "./allOf"
import ifKeyword, {IfKeywordError} from "./if"
import thenElse from "./thenElse"

const applicator: Vocabulary = [
  // any
  notKeyword,
  anyOf,
  oneOf,
  allOf,
  ifKeyword,
  thenElse,
  // array
  additionalItems,
  items,
  contains,
  // object
  propertyNames,
  additionalProperties,
  dependencies,
  properties,
  patternProperties,
]

export default applicator

export type ApplicatorKeywordError =
  | ErrorWithoutParams
  | AdditionalItemsError
  | ContainsError
  | AdditionalPropertiesError
  | DependenciesError
  | IfKeywordError
  | OneOfError
  | PropertyNamesError

export type ErrorWithoutParams = ErrorObject<
  "anyOf" | "not" | "false schema",
  Record<string, never>
>
