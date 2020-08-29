import {toHash} from "./util"
import {KeywordDefinition} from "../types"

export interface ValidationRules {
  rules: RuleGroup[]
  all: {[key: string]: boolean | Rule} // rules that have to be validated
  keywords: {[key: string]: boolean} // all known keywords (superset of "all")
  types: {[key: string]: boolean | RuleGroup}
  custom: {[key: string]: Rule}
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

export default function rules(): ValidationRules {
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
  const TYPES = ["number", "integer", "string", "array", "object", "boolean", "null"]

  const RULES: ValidationRules = {
    rules: [
      {type: "number", rules: []},
      {type: "string", rules: []},
      {type: "array", rules: []},
      {type: "object", rules: []},
      {rules: []},
    ],
    all: toHash(ALL),
    keywords: {},
    types: toHash(TYPES),
    custom: {},
  }

  RULES.rules.forEach((group) => {
    if (group.type) RULES.types[group.type] = group
  })

  RULES.keywords = toHash(ALL.concat(KEYWORDS))
  RULES.custom = {}

  return RULES
}
