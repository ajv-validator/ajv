import {KeywordDefinition, Vocabulary, ErrorObject, ValidateFunction} from "./types"

import {ValidationRules, Rule} from "./compile/rules"
import {definitionSchema} from "./definition_schema"
import {_} from "./compile/codegen"

const IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i

export function addVocabulary(this, definitions: Vocabulary, _skipValidation?: boolean): object {
  // TODO return type Ajv
  for (const def of definitions) {
    if (!def.keyword) throw new Error('Keyword definition must have "keyword" property')
    this.addKeyword(def, _skipValidation)
  }
  return this
}

// TODO Ajv
export function addKeyword(this, def: KeywordDefinition, _skipValidation?: boolean): object
export function addKeyword(this, keyword: string): object
export function addKeyword(
  this: any, // TODO Ajv
  kwdOrDef: string | KeywordDefinition,
  defOrSkip?: KeywordDefinition | boolean, // deprecated
  _skipValidation?: boolean // deprecated
): object {
  let keyword: string | string[]
  let definition: KeywordDefinition | undefined
  if (typeof kwdOrDef == "string") {
    keyword = kwdOrDef
    if (typeof defOrSkip == "object") {
      // this.logger.warn("this method signature is deprecated, see docs for addKeyword")
      definition = defOrSkip
      if (definition.keyword === undefined) definition.keyword = keyword
    }
  } else if (typeof kwdOrDef == "object" && typeof defOrSkip != "object") {
    definition = kwdOrDef
    keyword = definition.keyword
    _skipValidation = defOrSkip
  } else {
    throw new Error("invalid addKeywords parameters")
  }

  /* eslint no-shadow: 0 */
  const RULES: ValidationRules = this.RULES
  eachItem(keyword, (kwd) => {
    if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`)
    if (!IDENTIFIER.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`)
  })

  if (definition) {
    if (!_skipValidation) this.validateKeyword(definition, true)
    keywordMetaschema.call(this, definition)
  }
  const types = definition?.type
  eachItem(keyword, (kwd) => {
    eachItem(types, (t) => _addRule.call(this, kwd, t, definition))
  })

  return this
}

function _addRule(keyword: string, dataType?: string, definition?: KeywordDefinition) {
  const RULES: ValidationRules = this.RULES
  let ruleGroup = RULES.rules.find(({type: t}) => t === dataType)
  if (!ruleGroup) {
    ruleGroup = {type: dataType, rules: []}
    RULES.rules.push(ruleGroup)
  }

  RULES.keywords[keyword] = true
  if (!definition) return

  const rule: Rule = {
    keyword,
    definition,
  }

  if (definition?.before) {
    const i = ruleGroup.rules.findIndex((rule) => rule.keyword === definition.before)
    if (i >= 0) {
      ruleGroup.rules.splice(i, 0, rule)
    } else {
      ruleGroup.rules.push(rule)
      // TODO replace with Ajv this.logger
      this.logger.log(`rule ${definition.before} is not defined`)
    }
  } else {
    ruleGroup.rules.push(rule)
  }

  RULES.all[keyword] = rule
}

function eachItem<T>(xs: T | T[], f: (x: T) => void): void {
  if (Array.isArray(xs)) {
    for (const x of xs) f(x)
  } else {
    f(xs)
  }
}

const $dataRef = {
  $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
}

function keywordMetaschema(this: any, def: KeywordDefinition): void {
  // TODO this Ajv
  let metaSchema = def.metaSchema
  if (metaSchema === undefined) return
  if (def.$data && this._opts.$data) {
    metaSchema = {anyOf: [metaSchema, $dataRef]}
  }
  def.validateSchema = this.compile(metaSchema, true)
}

export function getKeyword(this, keyword: string): KeywordDefinition | boolean {
  const rule = this.RULES.all[keyword]
  return rule?.definition || rule || false
}

/**
 * Remove keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Ajv} this for method chaining
 */
export function removeKeyword(keyword: string): object {
  // TODO return type should be Ajv
  /* jshint validthis: true */
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

/**
 * Validate keyword definition
 * @this  Ajv
 * @param {Object} definition keyword definition object.
 * @param {Boolean} throwError true to throw exception if definition is invalid
 * @return {boolean} validation result
 */
export const validateKeyword: KeywordValidator = function (definition, throwError) {
  validateKeyword.errors = null
  const v: ValidateFunction = (this._validateKeyword =
    this._validateKeyword || this.compile(definitionSchema, true))

  if (v(definition)) return true
  validateKeyword.errors = v.errors
  if (throwError) {
    throw new Error("custom keyword definition is invalid: " + this.errorsText(v.errors))
  }
  return false
}
