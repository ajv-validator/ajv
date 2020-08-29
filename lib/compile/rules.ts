import {toHash} from "./util"
import {KeywordDefinition} from "../types"

export interface ValidationRules {
  rules: RuleGroup[]
  all: {[key: string]: boolean | Rule} // rules that have to be validated
  keywords: {[key: string]: boolean} // all known keywords (superset of "all")
  types: {[key: string]: boolean | RuleGroup}
}

export interface RuleGroup {
  type?: string
  rules: Rule[]
}

// This interface wraps KeywordDefinition because definition can have multiple keywords
export interface Rule {
  keyword: string
  definition: KeywordDefinition
}

const ALL = ["type", "$comment"]
const KEYWORDS = [
  "$schema",
  "$id",
  "id",
  "$data",
  "$async",
  "title",
  "description",
  "default",
  "definitions",
  "examples",
  "readOnly",
  "writeOnly",
  "contentMediaType",
  "contentEncoding",
  "then",
  "else",
]

export default function rules(): ValidationRules {
  const types = {
    number: {type: "number", rules: []},
    integer: true,
    string: {type: "string", rules: []},
    array: {type: "array", rules: []},
    object: {type: "object", rules: []},
    boolean: true,
    null: true,
  }
  return {
    types,
    rules: [types.number, types.string, types.array, types.object, {rules: []}],
    all: toHash(ALL),
    keywords: toHash(ALL.concat(KEYWORDS)),
  }
}
