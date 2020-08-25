import {toHash} from "./util"
import {CompilationContext, KeywordDefinition} from "../types"

export interface ValidationRules {
  rules: RuleGroup[]
  all: {[key: string]: boolean | Rule}
  keywords: {[key: string]: boolean}
  types: {[key: string]: boolean | RuleGroup}
  custom: {[key: string]: Rule}
}

export interface RuleGroup {
  type?: string
  rules: Rule[]
}

export interface Rule {
  keyword: string
  code: (it: CompilationContext, keyword: string, ruleType?: string) => void
  implements?: string[]
  definition?: KeywordDefinition
  custom?: true
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
    "additionalItems",
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
