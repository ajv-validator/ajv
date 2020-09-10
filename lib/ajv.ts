import {
  Schema,
  SchemaObject,
  Vocabulary,
  KeywordDefinition,
  Options,
  InstanceOptions,
  ValidateFunction,
  CacheInterface,
  Logger,
  ErrorObject,
  Format,
  AddedFormat,
  LoadSchemaFunction,
} from "./types"
import Cache from "./cache"
import {ValidationError, MissingRefError} from "./compile/error_classes"
import rules, {ValidationRules, Rule, RuleGroup} from "./compile/rules"
import {checkType} from "./compile/validate/dataType"
import {StoredSchema, compileStoredSchema, resolveSchema} from "./compile"
import {ValueScope} from "./compile/codegen"
import {normalizeId, getSchemaRefs} from "./compile/resolve"
import coreVocabulary from "./vocabularies/core"
import validationVocabulary from "./vocabularies/validation"
import applicatorVocabulary from "./vocabularies/applicator"
import formatVocabulary from "./vocabularies/format"
import {metadataVocabulary, contentVocabulary} from "./vocabularies/metadata"
import stableStringify from "fast-json-stable-stringify"
import {eachItem} from "./compile/util"

const META_SCHEMA_ID = "http://json-schema.org/draft-07/schema"

const META_IGNORE_OPTIONS = ["removeAdditional", "useDefaults", "coerceTypes"]
const META_SUPPORT_DATA = ["/properties"]
const EXT_SCOPE_NAMES = new Set([
  "validate",
  "root",
  "keyword",
  "pattern",
  "formats",
  "validate$data",
  "func",
  "Error",
])

type CompileAsyncCallback = (err: Error | null, validate?: ValidateFunction) => void

const optsDefaults = {
  strict: true,
  code: {},
  loopRequired: Infinity,
  loopEnum: Infinity,
}

export default class Ajv {
  _opts: InstanceOptions
  _cache: CacheInterface
  // shared external scope values for compiled functions
  _scope = new ValueScope({scope: {}, prefixes: EXT_SCOPE_NAMES})
  _schemas: {[key: string]: StoredSchema} = {}
  _refs: {[ref: string]: StoredSchema | string} = {}
  _fragments: {[key: string]: StoredSchema} = {}
  formats: {[name: string]: AddedFormat} = {}
  _compilations: Set<StoredSchema> = new Set()
  _compileQueue: StoredSchema[] = []
  _loadingSchemas: {[ref: string]: Promise<SchemaObject>} = {}
  _metaOpts: InstanceOptions
  RULES: ValidationRules
  logger: Logger
  errors?: ErrorObject[] | null // errors from the last validation

  static ValidationError = ValidationError
  static MissingRefError = MissingRefError

  constructor(opts: Options = {}) {
    opts = this._opts = {...optsDefaults, ...opts}
    this.logger = getLogger(opts.logger)
    const formatOpt = opts.format
    opts.format = false

    this._cache = opts.cache || new Cache()
    this.RULES = rules()
    checkDeprecatedOptions.call(this, opts)
    if (opts.serialize === undefined) opts.serialize = stableStringify
    this._metaOpts = getMetaSchemaOptions.call(this)

    if (opts.formats) addInitialFormats.call(this)
    this.addVocabulary(["$async"])
    this.addVocabulary(coreVocabulary)
    this.addVocabulary(validationVocabulary)
    this.addVocabulary(applicatorVocabulary)
    this.addVocabulary(formatVocabulary)
    this.addVocabulary(metadataVocabulary)
    this.addVocabulary(contentVocabulary)
    if (opts.keywords) addInitialKeywords.call(this, opts.keywords)
    addDefaultMetaSchema.call(this)
    if (typeof opts.meta == "object") this.addMetaSchema(opts.meta)
    addInitialSchemas.call(this)
    opts.format = formatOpt
  }

  // Validate data using schema
  // Schema will be compiled and cached using as a key JSON serialized with
  // [fast-json-stable-stringify](https://github.com/epoberezkin/fast-json-stable-stringify)
  validate(
    schemaKeyRef: Schema | string, // key, ref or schema object
    data: unknown // to be validated
  ): boolean | Promise<unknown> {
    let v: ValidateFunction | undefined
    if (typeof schemaKeyRef == "string") {
      v = this.getSchema(schemaKeyRef)
      if (!v) throw new Error('no schema with key or ref "' + schemaKeyRef + '"')
    } else {
      const schemaObj = _addSchema.call(this, schemaKeyRef)
      v = schemaObj.validate || compileStoredSchema.call(this, schemaObj)
    }

    const valid = v(data)
    if (v.$async !== true) this.errors = v.errors
    return valid
  }

  // Create validation function for passed schema
  compile(
    schema: Schema,
    _meta?: boolean // true if schema is a meta-schema. Used internally to compile meta schemas of custom keywords.
  ): ValidateFunction {
    const schemaObj = _addSchema.call(this, schema, undefined, _meta)
    return schemaObj.validate || compileStoredSchema.call(this, schemaObj)
  }

  // Creates validating function for passed schema with asynchronous loading of missing schemas.
  // `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
  compileAsync(
    schema: SchemaObject,
    metaOrCallback?: boolean | CompileAsyncCallback, // optional true to compile meta-schema; this parameter can be skipped
    callback?: CompileAsyncCallback
  ): Promise<ValidateFunction> {
    /* eslint no-shadow: 0 */
    const self = this
    if (typeof this._opts.loadSchema != "function") {
      throw new Error("options.loadSchema should be a function")
    }
    const loadSchema: LoadSchemaFunction = this._opts.loadSchema
    let meta: boolean | undefined
    if (typeof metaOrCallback == "function") callback = metaOrCallback
    else meta = metaOrCallback

    return runCompileAsync(schema, meta, callback)

    function runCompileAsync(sch: SchemaObject, _meta?: boolean, cb?: CompileAsyncCallback) {
      const p = loadMetaSchemaOf(sch).then(() => {
        const schemaObj = _addSchema.call(self, sch, undefined, _meta)
        return schemaObj.validate || _compileAsync(schemaObj)
      })
      if (cb) p.then((v) => cb(null, v), cb)
      return p
    }

    function loadMetaSchemaOf(sch: SchemaObject): Promise<ValidateFunction | void> {
      const $schema = sch.$schema
      return $schema && !self.getSchema($schema)
        ? runCompileAsync({$ref: $schema}, true)
        : Promise.resolve()
    }

    function _compileAsync(schemaObj: StoredSchema): ValidateFunction | Promise<ValidateFunction> {
      try {
        return compileStoredSchema.call(self, schemaObj)
      } catch (e) {
        if (e instanceof MissingRefError) return loadMissingSchema(schemaObj, e)
        throw e
      }
    }

    async function loadMissingSchema(
      schemaObj: StoredSchema,
      e: MissingRefError
    ): Promise<ValidateFunction> {
      const ref = e.missingSchema
      if (self._refs[ref]) {
        throw new Error(`Schema ${ref} is loaded but ${e.missingRef} cannot be resolved`)
      }
      let schPromise = self._loadingSchemas[ref]
      if (schPromise === undefined) {
        schPromise = self._loadingSchemas[ref] = loadSchema(ref)
        schPromise.then(removePromise, removePromise)
      }

      const sch = await schPromise
      if (!self._refs[ref]) await loadMetaSchemaOf(sch)
      if (!self._refs[ref]) self.addSchema(sch, ref, undefined, meta)
      return _compileAsync(schemaObj)

      function removePromise(): void {
        delete self._loadingSchemas[ref]
      }
    }
  }

  // Adds schema to the instance
  addSchema(
    schema: Schema | Schema[], // If array is passed, `key` will be ignored
    key?: string, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
    _skipValidation?: boolean, //true to skip schema validation. Used internally, option validateSchema should be used instead.
    _meta?: boolean // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
  ): Ajv {
    if (Array.isArray(schema)) {
      for (const sch of schema) this.addSchema(sch, undefined, _skipValidation, _meta)
      return this
    }
    let id: string | undefined
    if (typeof schema === "object") {
      id = schema.$id
      if (id !== undefined && typeof id != "string") throw new Error("schema id must be string")
    }
    key = normalizeId(key || id)
    checkUnique.call(this, key)
    this._schemas[key] = _addSchema.call(this, schema, _skipValidation, _meta, true)
    return this
  }

  // Add schema that will be used to validate other schemas
  // options in META_IGNORE_OPTIONS are alway set to false
  addMetaSchema(
    schema: SchemaObject,
    key?: string, // schema key
    skipValidation?: boolean // true to skip schema validation, can be used to override validateSchema option for meta-schema
  ): Ajv {
    this.addSchema(schema, key, skipValidation, true)
    return this
  }

  //  Validate schema against its meta-schema
  validateSchema(schema: Schema, throwOrLogError?: boolean): boolean | Promise<unknown> {
    if (typeof schema == "boolean") return true
    let $schema: string | SchemaObject | undefined = schema.$schema
    if ($schema !== undefined && typeof $schema != "string") {
      throw new Error("$schema must be a string")
    }
    $schema = $schema || this._opts.defaultMeta || defaultMeta.call(this)
    if (!$schema) {
      this.logger.warn("meta-schema not available")
      this.errors = null
      return true
    }
    const valid = this.validate($schema, schema)
    if (!valid && throwOrLogError) {
      const message = "schema is invalid: " + this.errorsText()
      if (this._opts.validateSchema === "log") this.logger.error(message)
      else throw new Error(message)
    }
    return valid
  }

  // Get compiled schema by `key` or `ref`.
  // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
  getSchema(keyRef: string): ValidateFunction | undefined {
    let schemaObj = _getSchemaObj.call(this, keyRef)
    if (schemaObj === undefined) {
      const root = {schema: {}, localRoot: {}, refVal: [], refs: {}}
      const env = resolveSchema.call(this, root, keyRef)
      if (!env) return
      schemaObj = this._fragments[keyRef] = new StoredSchema({...env, ref: keyRef, fragment: true})
    }
    if (typeof schemaObj == "string") return this.getSchema(schemaObj)
    return schemaObj.validate || compileStoredSchema.call(this, schemaObj)
  }

  // Remove cached schema(s).
  // If no parameter is passed all schemas but meta-schemas are removed.
  // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
  // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
  removeSchema(schemaKeyRef: Schema | string | RegExp): Ajv {
    if (schemaKeyRef instanceof RegExp) {
      _removeAllSchemas.call(this, this._schemas, schemaKeyRef)
      _removeAllSchemas.call(this, this._refs, schemaKeyRef)
      return this
    }
    switch (typeof schemaKeyRef) {
      case "undefined":
        _removeAllSchemas.call(this, this._schemas)
        _removeAllSchemas.call(this, this._refs)
        this._cache.clear()
        return this
      case "string": {
        const schemaObj = _getSchemaObj.call(this, schemaKeyRef)
        if (schemaObj) this._cache.del(schemaObj.cacheKey)
        delete this._schemas[schemaKeyRef]
        delete this._refs[schemaKeyRef]
        return this
      }
      case "object": {
        const serialize = this._opts.serialize
        const cacheKey = serialize ? serialize(schemaKeyRef) : schemaKeyRef
        this._cache.del(cacheKey)
        let id = schemaKeyRef.$id
        if (id) {
          id = normalizeId(id)
          delete this._schemas[id]
          delete this._refs[id]
        }
      }
    }
    return this
  }

  // add "vocabulary" - a collection of keywords
  addVocabulary(definitions: Vocabulary): Ajv {
    for (const def of definitions) this.addKeyword(def)
    return this
  }

  addKeyword(kwdOrDef: string | KeywordDefinition): Ajv
  addKeyword(
    kwdOrDef: string | KeywordDefinition,
    def?: KeywordDefinition // deprecated
  ): Ajv {
    let keyword: string | string[]
    if (typeof kwdOrDef == "string") {
      keyword = kwdOrDef
      if (typeof def == "object") {
        this.logger.warn("these parameters are deprecated, see docs for addKeyword")
        def.keyword = keyword
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

  getKeyword(keyword: string): KeywordDefinition | boolean {
    const rule = this.RULES.all[keyword]
    return typeof rule == "object" ? rule.definition : !!rule
  }

  // Remove keyword
  removeKeyword(keyword: string): Ajv {
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

  // Add format
  addFormat(name: string, format: Format): Ajv {
    if (typeof format == "string") format = new RegExp(format)
    this.formats[name] = format
    return this
  }

  errorsText(
    errors: ErrorObject[] | null | undefined = this.errors, // optional array of validation errors
    {separator = ", ", dataVar = "data"}: ErrorsTextOptions = {} // optional options with properties `separator` and `dataVar`
  ): string {
    if (!errors || errors.length === 0) return "No errors"
    return errors
      .map((e) => `${dataVar}${e.dataPath} ${e.message}`)
      .reduce((text, msg) => text + msg + separator)
  }

  $dataMetaSchema(metaSchema: SchemaObject, keywordsJsonPointers: string[]): SchemaObject {
    const rules = this.RULES.all
    for (const jsonPointer of keywordsJsonPointers) {
      metaSchema = JSON.parse(JSON.stringify(metaSchema))
      const segments = jsonPointer.split("/").slice(1) // first segment is an empty string
      let keywords = metaSchema
      for (const seg of segments) keywords = <SchemaObject>keywords[seg]

      for (const key in rules) {
        const rule = rules[key]
        if (typeof rule != "object") continue
        const $data = rule.definition?.$data
        const schema = <SchemaObject>keywords[key]
        if ($data && schema) keywords[key] = schemaOrData(schema)
      }
    }

    return metaSchema
  }
}

export interface ErrorsTextOptions {
  separator?: string
  dataVar?: string
}

function checkDeprecatedOptions(this: Ajv, opts: Options): void {
  if (opts.errorDataPath !== undefined) this.logger.error("NOT SUPPORTED: option errorDataPath")
  if (opts.schemaId !== undefined) this.logger.error("NOT SUPPORTED: option schemaId")
  if (opts.uniqueItems !== undefined) this.logger.error("NOT SUPPORTED: option uniqueItems")
  if (opts.jsPropertySyntax !== undefined) this.logger.warn("DEPRECATED: option jsPropertySyntax")
  if (opts.unicode !== undefined) this.logger.warn("DEPRECATED: option unicode")
}

function defaultMeta(this: Ajv): string | SchemaObject | undefined {
  const meta = this._opts.meta
  this._opts.defaultMeta =
    typeof meta == "object"
      ? meta.$id || meta
      : this.getSchema(META_SCHEMA_ID)
      ? META_SCHEMA_ID
      : undefined
  return this._opts.defaultMeta
}

function _getSchemaObj(this: Ajv, keyRef: string): StoredSchema | undefined {
  keyRef = normalizeId(keyRef)
  return this._schemas[keyRef] || this._refs[keyRef] || this._fragments[keyRef]
}

function _removeAllSchemas(
  this: Ajv,
  schemas: {[ref: string]: StoredSchema | string},
  regex?: RegExp
): void {
  for (const keyRef in schemas) {
    const schemaObj = schemas[keyRef]
    if (!regex || regex.test(keyRef)) {
      if (typeof schemaObj == "string") {
        delete schemas[keyRef]
      } else if (!schemaObj.meta) {
        this._cache.del(schemaObj.cacheKey)
        delete schemas[keyRef]
      }
    }
  }
}

function _addSchema(
  this: Ajv,
  schema: Schema,
  skipValidation?: boolean,
  meta?: boolean,
  shouldAddSchema?: boolean
): StoredSchema {
  if (typeof schema != "object" && typeof schema != "boolean") {
    throw new Error("schema must be object or boolean")
  }
  const serialize = this._opts.serialize
  const cacheKey = serialize ? serialize(schema) : schema
  const cached = this._cache.get(cacheKey)
  if (cached) return cached

  shouldAddSchema = shouldAddSchema || this._opts.addUsedSchema !== false

  let $id, $schema
  if (typeof schema == "object") {
    $id = schema.$id
    $schema = schema.$schema
  }
  const id = normalizeId($id)
  if (id && shouldAddSchema) checkUnique.call(this, id)

  const willValidate = this._opts.validateSchema !== false && !skipValidation
  let recursiveMeta
  if (willValidate && !(recursiveMeta = id && id === normalizeId($schema))) {
    this.validateSchema(schema, true)
  }

  const localRefs = getSchemaRefs.call(this, schema)

  const schemaObj = new StoredSchema({id, schema, localRefs, cacheKey, meta})

  if (id[0] !== "#" && shouldAddSchema) this._refs[id] = schemaObj
  this._cache.put(cacheKey, schemaObj)

  if (willValidate && recursiveMeta) this.validateSchema(schema, true)

  return schemaObj
}

function addDefaultMetaSchema(this: Ajv): void {
  let $dataSchema
  if (this._opts.$data) {
    $dataSchema = require("./refs/data.json")
    this.addMetaSchema($dataSchema, $dataSchema.$id, true)
  }
  if (this._opts.meta === false) return
  let metaSchema = require("./refs/json-schema-draft-07.json")
  if (this._opts.$data) {
    metaSchema = this.$dataMetaSchema(metaSchema, META_SUPPORT_DATA)
  }
  this.addMetaSchema(metaSchema, META_SCHEMA_ID, true)
  this._refs["http://json-schema.org/schema"] = META_SCHEMA_ID
}

function addInitialSchemas(this: Ajv): void {
  const optsSchemas = this._opts.schemas
  if (!optsSchemas) return
  if (Array.isArray(optsSchemas)) this.addSchema(optsSchemas)
  else for (const key in optsSchemas) this.addSchema(optsSchemas[key], key)
}

function addInitialFormats(this: Ajv): void {
  for (const name in this._opts.formats) {
    const format = this._opts.formats[name]
    this.addFormat(name, format)
  }
}

function addInitialKeywords(this: Ajv, defs: Vocabulary | {[x: string]: KeywordDefinition}): void {
  if (Array.isArray(defs)) {
    this.addVocabulary(defs)
    return
  }
  this.logger.warn("keywords option as map is deprecated, pass array")
  for (const keyword in defs) {
    const def = defs[keyword]
    if (!def.keyword) def.keyword = keyword
    this.addKeyword(def)
  }
}

function checkUnique(this: Ajv, id: string): void {
  if (this._schemas[id] || this._refs[id]) {
    throw new Error('schema with key or id "' + id + '" already exists')
  }
}

function getMetaSchemaOptions(this: Ajv): InstanceOptions {
  const metaOpts = {...this._opts}
  for (const opt of META_IGNORE_OPTIONS) delete metaOpts[opt]
  return metaOpts
}

const noLogs = {log() {}, warn() {}, error() {}}

function getLogger(logger?: Logger | false): Logger {
  if (logger === false) return noLogs
  if (logger === undefined) return console
  if (!(typeof logger == "object" && logger.log && logger.warn && logger.error)) {
    throw new Error("logger must implement log, warn and error methods")
  }
  return logger
}

const KEYWORD_NAME = /^[a-z_$][a-z0-9_$-]*$/i

function checkKeyword(this: Ajv, keyword: string | string[], def?: KeywordDefinition): void {
  /* eslint no-shadow: 0 */
  const RULES: ValidationRules = this.RULES
  eachItem(keyword, (kwd) => {
    if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`)
    if (!KEYWORD_NAME.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`)
  })
  if (!def) return
  if (def.type) eachItem(def.type, (t) => checkType(t, RULES))
  if (def.$data && !("code" in def || "validate" in def)) {
    throw new Error('$data keyword must have "code" or "validate" function')
  }
}

function _addRule(
  this: Ajv,
  keyword: string,
  dataType?: string,
  definition?: KeywordDefinition
): void {
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

function _addBeforeRule(this: Ajv, ruleGroup: RuleGroup, rule: Rule, before: string): void {
  const i = ruleGroup.rules.findIndex((rule) => rule.keyword === before)
  if (i >= 0) {
    ruleGroup.rules.splice(i, 0, rule)
  } else {
    ruleGroup.rules.push(rule)
    this.logger.warn(`rule ${before} is not defined`)
  }
}

function keywordMetaschema(this: Ajv, def: KeywordDefinition): void {
  let metaSchema = def.metaSchema
  if (metaSchema === undefined) return
  if (def.$data && this._opts.$data) metaSchema = schemaOrData(metaSchema)
  def.validateSchema = this.compile(metaSchema, true)
}

const $dataRef = {
  $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
}

function schemaOrData(schema: Schema): SchemaObject {
  return {anyOf: [schema, $dataRef]}
}

module.exports = Ajv
