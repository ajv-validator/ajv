import {KeywordDefinition, Vocabulary, ErrorObject} from "./types"
import {ValidationRules, Rule, RuleGroup} from "./compile/rules"
import {schemaOrData} from "./data"
import {checkType} from "./compile/validate/dataType"

const IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i

export function addVocabulary(this, definitions: Vocabulary): object {
  // TODO return type Ajv
  for (const def of definitions) this.addKeyword(def)
  return this
}

// TODO Ajv
export function addKeyword(this, def: KeywordDefinition): object
export function addKeyword(this, keyword: string): object
export function addKeyword(
  this: any, // TODO Ajv
  kwdOrDef: string | KeywordDefinition,
  def?: KeywordDefinition // deprecated
): object {
  let keyword: string | string[]
  if (typeof kwdOrDef == "string") {
    keyword = kwdOrDef
    if (typeof def == "object") {
      // TODO enable once tests are updated
      // this.logger.warn("these parameters are deprecated, see docs for addKeyword")
      if (def.keyword === undefined) def.keyword = keyword
      else if (def.keyword !== keyword) throw new Error("invalid addKeyword parameters")
    }
  } else if (typeof kwdOrDef == "object" && def === undefined) {
    def = kwdOrDef
    keyword = def.keyword
  } else {
    throw new Error("invalid addKeywords parameters")
  }

  checkKeyword.call(this, keyword, def)
  if (def) keywordMetaschema.call(this, def)
  eachItem(keyword, (kwd) => {
    eachItem(def?.type, (t) => _addRule.call(this, kwd, t, def))
  })
  return this
}

function checkKeyword(keyword: string | string[], def?: KeywordDefinition) {
  /* eslint no-shadow: 0 */
  const RULES: ValidationRules = this.RULES
  eachItem(keyword, (kwd) => {
    if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`)
    if (!IDENTIFIER.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`)
  })
  if (!def) return
  if (def.type) eachItem(def.type, (t) => checkType(t, RULES))
  if (def.$data && !("code" in def || "validate" in def)) {
    throw new Error('$data keyword must have "code" or "validate" function')
  }
}

function _addRule(keyword: string, dataType?: string, definition?: KeywordDefinition): void {
  const RULES: ValidationRules = this.RULES
  let ruleGroup = RULES.rules.find(({type: t}) => t === dataType)
  if (!ruleGroup) {
    ruleGroup = {type: dataType, rules: []}
    RULES.rules.push(ruleGroup)
  }
  RULES.keywords[keyword] = true
  if (!definition) return

  const rule: Rule = {keyword, definition}
  if (definition.before) _addBeforeRule.call(this, ruleGroup, rule, definition.before)
  else ruleGroup.rules.push(rule)
  RULES.all[keyword] = rule
  definition.implements?.forEach((kwd) => this.addKeyword(kwd))
}

function _addBeforeRule(this, ruleGroup: RuleGroup, rule: Rule, before: string): void {
  const i = ruleGroup.rules.findIndex((rule) => rule.keyword === before)
  if (i >= 0) {
    ruleGroup.rules.splice(i, 0, rule)
  } else {
    ruleGroup.rules.push(rule)
    this.logger.warn(`rule ${before} is not defined`)
  }
}

function eachItem<T>(xs: T | T[], f: (x: T) => void): void {
  if (Array.isArray(xs)) {
    for (const x of xs) f(x)
  } else {
    f(xs)
  }
}

function keywordMetaschema(this: any, def: KeywordDefinition): void {
  // TODO this Ajv
  let metaSchema = def.metaSchema
  if (metaSchema === undefined) return
  if (def.$data && this._opts.$data) metaSchema = schemaOrData(metaSchema)
  def.validateSchema = this.compile(metaSchema, true)
}

export function getKeyword(this, keyword: string): KeywordDefinition | boolean {
  const rule = this.RULES.all[keyword]
  return rule?.definition || rule || false
}

/**
 * Remove keyword
 * @this  Ajv
 * @param {String} keyword keyword.
 * @return {Ajv} this for method chaining
 */
export function removeKeyword(keyword: string): object {
  // TODO return type should be Ajv
  const RULES: ValidationRules = this.RULES
  delete RULES.keywords[keyword]
  delete RULES.all[keyword]
  for (const group of RULES.rules) {
    const i = group.rules.findIndex((rule) => rule.keyword === keyword)
    if (i >= 0) group.rules.splice(i, 1)
  }
  return this
}

export interface KeywordValidator {
  (definition: KeywordDefinition, throwError: boolean): boolean
  errors?: ErrorObject[] | null
}
