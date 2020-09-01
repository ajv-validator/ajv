import {toHash} from "./util"
import {KeywordDefinition} from "../types"

type ValidationTypes = {[key: string]: boolean | RuleGroup}

export interface ValidationRules {
  rules: RuleGroup[]
  all: {[key: string]: boolean | Rule} // rules that have to be validated
  keywords: {[key: string]: boolean} // all known keywords (superset of "all")
  types: ValidationTypes
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
]

export default function rules(): ValidationRules {
  const groups = {
    number: {type: "number", rules: []},
    string: {type: "string", rules: []},
    array: {type: "array", rules: []},
    object: {type: "object", rules: []},
  }
  return {
    types: {...groups, integer: true, boolean: true, null: true},
    rules: [groups.number, groups.string, groups.array, groups.object, {rules: []}],
    all: toHash(ALL),
    keywords: toHash(ALL.concat(KEYWORDS)),
  }
}
