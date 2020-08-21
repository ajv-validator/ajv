import {
  KeywordDefinition,
  KeywordErrorDefinition,
  Vocabulary,
  ErrorObject,
  ValidateFunction,
  CompilationContext,
  KeywordContext,
  KeywordContextParams,
} from "./types"

import {ValidationRules, Rule} from "./compile/rules"
import {reportError} from "./compile/errors"
import {getData} from "./compile/util"
import {schemaRefOrVal} from "./vocabularies/util"
import {definitionSchema} from "./definition_schema"

const IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i
const customRuleCode = require("./dotjs/custom")

/**
 * Define vocabulary
 * @this  Ajv
 * @param {Array<Object>} definitions array of keyword definitions
 * @param {Boolean} _skipValidation skip definition validation
 * @return {Ajv} this for method chaining
 */
export function addVocabulary(definitions: Vocabulary, _skipValidation?: boolean): object {
  // TODO return type Ajv
  for (const def of definitions) {
    if (!def.keyword) {
      throw new Error('Vocabulary keywords must have "keyword" property in definition')
    }
    if (Array.isArray(def.keyword)) {
      for (const keyword of def.keyword) {
        this.addKeyword(keyword, def, _skipValidation)
      }
    } else {
      this.addKeyword(def.keyword, def, _skipValidation)
    }
  }
  return this
}

// TODO use overloading when switched to typescript to allow not passing keyword
/**
 * Define keyword
 * @this  Ajv
 * @param {String} keyword custom keyword, should be unique (including different from all standard, custom and macro keywords).
 * @param {Object} definition keyword definition object with properties `type` (type(s) which the keyword applies to), `validate` or `compile`.
 * @param {Boolean} _skipValidation of keyword definition
 * @return {Ajv} this for method chaining
 */
export function addKeyword(
  keyword: string,
  definition: KeywordDefinition,
  _skipValidation?: boolean
): object {
  // TODO return type Ajv
  /* eslint no-shadow: 0 */
  const RULES: ValidationRules = this.RULES
  if (RULES.keywords[keyword]) {
    throw new Error("Keyword " + keyword + " is already defined")
  }

  if (!IDENTIFIER.test(keyword)) {
    throw new Error("Keyword " + keyword + " is not a valid identifier")
  }

  // TODO any
  const self = this

  if (definition) {
    if (!_skipValidation) this.validateKeyword(definition, true)
    const dataType = definition.type
    if (Array.isArray(dataType)) {
      for (const t of dataType) {
        _addRule(keyword, t, definition)
      }
    } else {
      _addRule(keyword, dataType, definition)
    }

    let metaSchema = definition.metaSchema
    if (metaSchema) {
      if (definition.$data && this._opts.$data) {
        metaSchema = {
          anyOf: [
            metaSchema,
            {
              $ref:
                "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
            },
          ],
        }
      }
      definition.validateSchema = this.compile(metaSchema, true)
    }
  }

  RULES.keywords[keyword] = RULES.all[keyword] = true

  function _addRule(keyword: string, dataType: string | undefined, definition: KeywordDefinition) {
    let ruleGroup = RULES.rules.find(({type: t}) => t === dataType)

    if (!ruleGroup) {
      ruleGroup = {type: dataType, rules: []}
      RULES.rules.push(ruleGroup)
    }

    const rule: Rule = {
      keyword,
      definition,
      custom: true,
      code: definition.code ? ruleCode : customRuleCode,
      implements: definition.implements,
    }

    if (definition.before) {
      // TODO remove type case when RuleDef is removed
      const i = ruleGroup.rules.findIndex((rule) => (rule as Rule).keyword === definition.before)
      if (i >= 0) {
        ruleGroup.rules.splice(i, 0, rule)
      } else {
        ruleGroup.rules.push(rule)
        // TODO replace with Ajv this.logger
        self.logger.log(`rule ${definition.before} is not defined`)
      }
    } else {
      ruleGroup.rules.push(rule)
    }

    RULES.custom[keyword] = rule
  }

  return this
}

/**
 * Generate keyword code
 * @this rule
 * @param {Object} it schema compilation context.
 * @param {String} keyword pre-defined or custom keyword.
 */
function ruleCode(it: CompilationContext, keyword: string /*, ruleType */): void {
  const schema = it.schema[keyword]
  const {schemaType, code, error, $data: $defData}: KeywordDefinition = this.definition
  const {gen, opts, dataLevel, schemaPath, dataPathArr, allErrors} = it
  if (!code) throw new Error('"code" and "error" must be defined')
  const $data = $defData && opts.$data && schema && schema.$data
  const data = "data" + (dataLevel || "")
  const schemaValue = schemaRefOrVal(schema, schemaPath, keyword, $data)
  const cxt: KeywordContext = {
    gen,
    fail,
    ok,
    errorParams,
    keyword,
    data,
    $data,
    schema,
    schemaCode: $data ? gen.name("schema") : schemaValue,
    schemaValue,
    parentSchema: it.schema,
    params: {},
    it,
  }
  if ($data) {
    gen.code(`const ${cxt.schemaCode} = ${getData($data, dataLevel, dataPathArr)};`)
  } else if (schemaType && !validSchemaType(schema, schemaType)) {
    throw new Error(`${keyword} must be ${JSON.stringify(schemaType)}`)
  }
  // TODO check that code called "fail" or another valid way to return code
  code(cxt)

  // TODO replace with fail_ below
  function fail(condition?: string, context?: KeywordContext): void {
    if (condition) {
      gen.code(`if (${condition}) {`)
      _reportError()
      gen.code(allErrors ? "}" : "} else {")
    } else {
      _reportError()
      if (!allErrors) gen.code("if (false) {")
    }

    function _reportError() {
      reportError(context || cxt, error as KeywordErrorDefinition)
    }
  }

  function ok(condition?: string): void {
    if (condition) fail(`!(${condition})`)
    else if (!allErrors) gen.code("if (true) {")
  }

  function errorParams(obj: KeywordContextParams, assign?: true) {
    if (assign) Object.assign(cxt.params, obj)
    else cxt.params = obj
  }
}

// TODO remove when "fail" replaced
export function fail_(condition: string, cxt: KeywordContext, error: KeywordErrorDefinition): void {
  const {gen, allErrors} = cxt.it
  gen.if(condition)
  reportError(cxt, error)
  if (allErrors) gen.endIf()
  else gen.else()
}

function validSchemaType(schema: any, schemaType: string | string[]): boolean {
  // TODO add tests
  if (Array.isArray(schemaType)) {
    return schemaType.some((st) => validSchemaType(schema, st))
  }
  return schemaType === "array"
    ? Array.isArray(schema)
    : schemaType === "object"
    ? schema && typeof schema == "object" && !Array.isArray(schema)
    : typeof schema == schemaType
}

export function getKeywordContext(it: CompilationContext, keyword: string): KeywordContext {
  const {gen, schema, schemaPath, dataLevel} = it
  const schemaCode = schemaRefOrVal(schema, schemaPath, keyword)
  return {
    gen,
    fail: exception,
    ok: exception,
    errorParams: exception,
    keyword,
    data: "data" + (dataLevel || ""),
    schema: schema[keyword],
    schemaCode,
    schemaValue: schemaCode,
    parentSchema: schema,
    params: {},
    it,
  }
}

function exception() {
  throw new Error("this function can only be used in keyword")
}

/**
 * Get keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
 */
export function getKeyword(keyword: string): KeywordDefinition | boolean {
  /* jshint validthis: true */
  const rule = this.RULES.custom[keyword]
  return rule ? rule.definition : this.RULES.keywords[keyword] || false
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
  delete RULES.custom[keyword]
  for (const group of RULES.rules) {
    // TODO remove <Rule> type cast once all rules migrated
    const i = group.rules.findIndex((rule) => (<Rule>rule).keyword === keyword)
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
