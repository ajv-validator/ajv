var IDENTIFIER = /^[a-z_$][a-z0-9_$-]*$/i
var customRuleCode = require("./dotjs/custom")
var definitionSchema = require("./definition_schema")
var util = require("./compile/util")

// export interface KeywordDefinition {
//   type?: string | string[]
//   async?: boolean
//   $data?: boolean
//   errors?: boolean | "full"
//   metaSchema?: object
//   // schema: false makes validate not to expect schema (ValidateFunction)
//   schema?: boolean
//   statements?: boolean
//   dependencies?: string[]
//   modifying?: boolean
//   valid?: boolean
//   // at least one of the following properties should be present
//   validate?: SchemaValidateFunction | ValidateFunction
//   compile?: (
//     schema: any,
//     parentSchema: object,
//     it: CompilationContext
//   ) => ValidateFunction
//   macro?: (
//     schema: any,
//     parentSchema: object,
//     it: CompilationContext
//   ) => object | boolean
//   inline?: (
//     it: CompilationContext,
//     keyword: string,
//     schema: any,
//     parentSchema: object
//   ) => string
//   code?: {
//   }
// }

/**
 * Define vocabulary
 * @this  Ajv
 * @param {Array<Object>} definitions array of keyword definitions
 * @param {Boolean} _skipValidation skip definition validation
 * @return {Ajv} this for method chaining
 */
export function addVocabulary(definitions, _skipValidation) {
  for (const def of definitions) {
    for (const keyword of def.keywords)
      this.addKeyword(keyword, def, _skipValidation)
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
export function addKeyword(keyword, definition, _skipValidation) {
  /* eslint no-shadow: 0 */
  var RULES = this.RULES
  if (RULES.keywords[keyword])
    throw new Error("Keyword " + keyword + " is already defined")

  if (!IDENTIFIER.test(keyword))
    throw new Error("Keyword " + keyword + " is not a valid identifier")

  if (definition) {
    if (!_skipValidation) this.validateKeyword(definition, true)

    var dataType = definition.type
    if (Array.isArray(dataType)) {
      for (var i = 0; i < dataType.length; i++)
        _addRule(keyword, dataType[i], definition)
    } else {
      _addRule(keyword, dataType, definition)
    }

    var metaSchema = definition.metaSchema
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

  function _addRule(keyword, dataType, definition) {
    var ruleGroup
    for (var i = 0; i < RULES.length; i++) {
      var rg = RULES[i]
      if (rg.type == dataType) {
        ruleGroup = rg
        break
      }
    }

    if (!ruleGroup) {
      ruleGroup = {type: dataType, rules: []}
      RULES.push(ruleGroup)
    }

    var rule = {
      keyword: keyword,
      definition: definition,
      custom: true,
      code: definition.code ? ruleCode : customRuleCode,
      implements: definition.implements,
    }
    ruleGroup.rules.push(rule)
    RULES.custom[keyword] = rule
  }

  return this
}

/**
 * Generate keyword code
 * @this rule
 * @param {Object} it schema compilation context.
 * @param {String} keyword pre-defined or custom keyword.
 * @return {String} compiled rule code.
 */
function ruleCode(it, keyword /*, ruleType */) {
  const schema = it.schema[keyword]
  const {schemaType, code, error, $data: $defData} = this.definition
  let schemaCode
  let out = ""
  const $data = $defData && it.opts.$data && schema && schema.$data
  if ($data) {
    // TODO stop using it.level and maybe it.dataLevel
    // schemaCode = it.getName("schema")
    schemaCode = `schema${it.level}`
    // TODO replace with const once it.level replaced with unique names
    out += `var ${schemaCode} = ${util.getData(
      $data,
      it.dataLevel,
      it.dataPathArr
    )};`
  } else {
    if (schemaType && typeof schema !== schemaType)
      throw new Error(`${keyword} must be ${schemaType}`)
    schemaCode = schemaRefOrVal()
  }
  const data = "data" + (it.dataLevel || "")
  const cxt = {fail, keyword, data, $data, schemaCode, opts: it.opts}
  // TODO check that code called "fail" or another valid way to return code
  code(cxt)
  return out

  function fail(condition) {
    out += `if (${condition}) { ${reportError()} }`
    if (!it.opts.allErrors) out += `else {`
  }

  function reportError() {
    const errCode = errorObjectCode()
    if (!it.compositeRule && !it.opts.allErrors) {
      // TODO trim whitespace
      return it.async
        ? `throw new ValidationError([${errCode}]);`
        : `validate.errors = [${errCode}];
          return false;`
    }
    return `const err = ${errCode};
    if (vErrors === null) vErrors = [err];
    else vErrors.push(err);
    errors++;`
  }

  function errorObjectCode() {
    if (it.createErrors === false) return "{}"
    // TODO trim whitespace
    let out = `{
      keyword: "${keyword}",
      dataPath: (dataPath || "") + ${it.errorPath},
      schemaPath: ${util.toQuotedString(it.errSchemaPath + "/" + keyword)},
      params: ${error.params(cxt)},`
    if (it.opts.messages !== false) out += `message: ${error.message(cxt)},`
    if (it.opts.verbose) {
      // TODO trim whitespace
      out += `
        schema: ${schemaRefOrVal()},
        parentSchema: validate.schema${it.schemaPath},
        data: ${data},`
    }
    return out + "}"
  }

  function schemaRefOrVal() {
    return schemaType === "number" && !$data
      ? schema
      : `validate.schema${it.schemaPath + util.getProperty(keyword)}`
  }
}

/**
 * Get keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Object|Boolean} custom keyword definition, `true` if it is a predefined keyword, `false` otherwise.
 */
export function getKeyword(keyword) {
  /* jshint validthis: true */
  var rule = this.RULES.custom[keyword]
  return rule ? rule.definition : this.RULES.keywords[keyword] || false
}

/**
 * Remove keyword
 * @this  Ajv
 * @param {String} keyword pre-defined or custom keyword.
 * @return {Ajv} this for method chaining
 */
export function removeKeyword(keyword) {
  /* jshint validthis: true */
  var RULES = this.RULES
  delete RULES.keywords[keyword]
  delete RULES.all[keyword]
  delete RULES.custom[keyword]
  for (var i = 0; i < RULES.length; i++) {
    var rules = RULES[i].rules
    for (var j = 0; j < rules.length; j++) {
      if (rules[j].keyword == keyword) {
        rules.splice(j, 1)
        break
      }
    }
  }
  return this
}

/**
 * Validate keyword definition
 * @this  Ajv
 * @param {Object} definition keyword definition object.
 * @param {Boolean} throwError true to throw exception if definition is invalid
 * @return {boolean} validation result
 */
export function validateKeyword(definition, throwError) {
  validateKeyword.errors = null
  var v = (this._validateKeyword =
    this._validateKeyword || this.compile(definitionSchema, true))

  if (v(definition)) return true
  validateKeyword.errors = v.errors
  if (throwError) {
    throw new Error(
      "custom keyword definition is invalid: " + this.errorsText(v.errors)
    )
  }
  return false
}
