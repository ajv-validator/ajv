export {
  Format,
  FormatDefinition,
  AsyncFormatDefinition,
  KeywordDefinition,
  KeywordErrorDefinition,
  CodeKeywordDefinition,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  Vocabulary,
  Schema,
  SchemaObject,
  AnySchemaObject,
  AsyncSchema,
  AnySchema,
  ValidateFunction,
  AsyncValidateFunction,
  AnyValidateFunction,
  ErrorObject,
  ErrorNoParams,
} from "./types"

export {SchemaCxt, SchemaObjCxt} from "./compile"
export interface Plugin<Opts> {
  (ajv: Ajv, options?: Opts): Ajv
  [prop: string]: any
}

export {KeywordCxt} from "./compile/validate"
export {DefinedError} from "./vocabularies/errors"
export {JSONType} from "./compile/rules"
export {JSONSchemaType} from "./types/json-schema"
export {JTDSchemaType, SomeJTDSchemaType, JTDDataType} from "./types/jtd-schema"
export {_, str, stringify, nil, Name, Code, CodeGen, CodeGenOptions} from "./compile/codegen"

import type {
  Schema,
  AnySchema,
  AnySchemaObject,
  SchemaObject,
  AsyncSchema,
  Vocabulary,
  KeywordDefinition,
  AddedKeywordDefinition,
  AnyValidateFunction,
  ValidateFunction,
  AsyncValidateFunction,
  ErrorObject,
  Format,
  AddedFormat,
} from "./types"
import type {JSONSchemaType} from "./types/json-schema"
import type {JTDSchemaType, SomeJTDSchemaType, JTDDataType} from "./types/jtd-schema"
import ValidationError from "./runtime/validation_error"
import MissingRefError from "./compile/ref_error"
import {getRules, ValidationRules, Rule, RuleGroup, JSONType} from "./compile/rules"
import {SchemaEnv, compileSchema, resolveSchema} from "./compile"
import {Code, ValueScope} from "./compile/codegen"
import {normalizeId, getSchemaRefs} from "./compile/resolve"
import {getJSONTypes} from "./compile/validate/dataType"
import {eachItem} from "./compile/util"

import * as $dataRefSchema from "./refs/data.json"

const META_IGNORE_OPTIONS: (keyof Options)[] = ["removeAdditional", "useDefaults", "coerceTypes"]
const EXT_SCOPE_NAMES = new Set([
  "validate",
  "serialize",
  "parse",
  "wrapper",
  "root",
  "schema",
  "keyword",
  "pattern",
  "formats",
  "validate$data",
  "func",
  "obj",
  "Error",
])

export type Options = CurrentOptions & DeprecatedOptions

export interface CurrentOptions {
  // strict mode options (NEW)

  /**
   * ### strict
   *
   * By default Ajv executes in strict mode, that is designed to prevent any
   * unexpected behaviours or silently ignored mistakes in schemas (see [Strict
   * Mode](./strict-mode.md) for more details). It does not change any
   * validation results, but it makes some schemas invalid that would be
   * otherwise valid according to JSON Schema specification.
   *
   * **Option values:**
   *
   * - `true` - throw an exception when any strict mode restriction is violated.
   * - `"log"` - log warning when any strict mode restriction is violated.
   * - `false` - ignore all strict mode violations.
   * - `undefined` (default) - use defaults for options strictSchema,
   *   strictNumbers, strictTypes, strictTuples and strictRequired.
   */
  strict?: boolean | "log"
  /**
   * ### strictSchema
   *
   * Prevent unknown keywords, formats etc. (see [Strict
   * schema](./strict-mode.md#strict-schema))
   *
   * **Option values:**
   *
   * - `true` (default) - throw an exception when any strict schema restriction
   *   is violated.
   * - `"log"` - log warning when any strict schema restriction is violated.
   * - `false` - ignore all strict schema violations.
   */
  strictSchema?: boolean | "log"
  /**
   * Whether to accept `NaN` and `Infinity` as number types during validation.
   *
   * **Option values:**
   *
   * - `true` (default) - fail validation if `NaN` or `Infinity` is passed where
   *   number is expected.
   * - `false` - allow `NaN` and `Infinity` as number.
   */
  strictNumbers?: boolean | "log"
  /**
   * ### strictTypes
   *
   * See [Strict types](./strict-mode.md#strict-types)
   *
   * **Option values:**
   * - `true` - throw an exception when any strict types restriction is
   *   violated.
   * - `"log"` (default) - log warning when any strict types restriction is
   *   violated.
   * - `false` - ignore all strict types violations.
   */
  strictTypes?: boolean | "log"
  /**
   * ### strictTuples
   *
   * See [Unconstrained tuples](./strict-mode.md#unconstrained-tuples) Option
   * values:
   *
   * - `true` - throw an exception when any strict tuples restriction is
   *   violated.
   * - `"log"` (default) - log warning when any strict tuples restriction is
   *   violated.
   * - `false` - ignore all strict tuples violations.
   */
  strictTuples?: boolean | "log"
  /**
   * ### strictRequired
   *
   * See [Defined required
   * properties](https://ajv.js.org/strict-mode#defined-required-properties)
   *
   * Option values:
   *
   * - `true` - throw an exception when strict required restriction is violated.
   * - `"log"` - log warning when strict required restriction is violated.
   * - `false` (default) - ignore strict required violations.
   *
   **/
  strictRequired?: boolean | "log"
  /**
   * ### allowMatchingProperties
   *
   * Pass true to allow overlap between "properties" and "patternProperties".
   * Does not affect other strict mode restrictions.
   *
   * See [Strict Mode](https://ajv.js.org/strict-mode.html).
   *
   **/
  allowMatchingProperties?: boolean // disables a strict mode restriction
  /**
   * ### allowUnionTypes
   *
   * Pass true to allow using multiple non-null types in "type" keyword (one of
   * `strictTypes` restrictions).
   *
   * see [Strict types](https://ajv.js.org/strict-mode#strict-types)
   **/
  allowUnionTypes?: boolean
  /**
   * ### validateFormats
   *
   * Format validation.
   *
   * Option values:
   *
   * - `true` (default) - validate formats (see
   *   [Formats](https://ajv.js.org/guide/formats.md)). In [strict
   *   mode](https://ajv.js.org/strict-mode.html) unknown formats will throw
   *   exception during schema compilation (and fail validation in case format
   *   keyword value is [\$data
   *   reference](./guide/combining-schemas#data-reference)).
   * - `false` - do not validate any format keywords (TODO they will still
   *   collect annotations once supported).
   **/
  validateFormats?: boolean

  // validation and reporting options:

  /**
   * ### $data
   *
   * Support [\$data
   * references](https://ajv.js.org/guide/combining-schemas#data-reference).
   * Draft 6 meta-schema that is added by default will be extended to allow
   * them. If you want to use another meta-schema you need to use
   * $dataMetaSchema method to add support for $data reference. See
   * [API](https://ajv.js.org/options.htmlajv-constructor-and-methods).
   **/
  $data?: boolean
  /**
   * ### allErrors
   *
   * Check all rules collecting all errors. Default is to return after the first
   * error.
   **/
  allErrors?: boolean
  /**
   * ### verbose
   *
   * Include the reference to the part of the schema (`schema` and
   * `parentSchema`) and validated data in errors (false by default).
   **/
  verbose?: boolean
  /**
   * ### discriminator
   *
   * Support [discriminator
   * keyword](https://ajv.js.org/json-schema#discriminator) from [OpenAPI
   * specification](https://github.com/OAI/OpenAPI-Specification/blob/master/versions/3.1.0.md).
   **/
  discriminator?: boolean
  /**
   * ### unicodeRegExp
   *
   * By default Ajv uses unicode flag "u" with "pattern" and
   * "patternProperties", as per JSON Schema spec. See
   * [RegExp.prototype.unicode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/RegExp/unicode).
   *
   * Option values:
   *
   * - `true` (default) - use unicode flag "u".
   * - `false` - do not use flag "u".
   **/
  unicodeRegExp?: boolean
  /**
   * ### timestamp
   *
   * Defines which Javascript types will be accepted for the [JTD timestamp
   * type](./json-type-definition#type-form).
   *
   * By default Ajv will accept both Date objects and
   * [RFC3339](https://datatracker.ietf.org/doc/rfc3339/) strings. You can
   * specify allowed values with the option `timestamp: "date"` or `timestamp:
   * "string"`.
   *
   * *JTD only*
   **/
  timestamp?: "string" | "date"
  /**
   * ### parseDate
   *
   * Defines how date-time strings are parsed by [JTD
   * parsers](https://ajv.js.org/api#jtd-parse). By default Ajv parses date-time
   * strings as string. Use `parseDate: true` to parse them as Date objects.
   *
   * *JTD only*
   **/
  parseDate?: boolean // JTD only
  /**
   * ### allowDate
   *
   * Defines how date-time strings are parsed and validated. By default Ajv only
   * allows full date-time strings, as required by JTD specification. Use
   * `allowDate: true` to allow date strings both for validation and for
   * parsing.
   *
   * #### *warning*
   * Option `allowDate` is not portable
   *
   * This option makes JTD validation and parsing more permissive and
   * non-standard. The date strings without time part will be accepted by Ajv,
   * but will be rejected by other JTD validators.
   *
   * *JTD only*
   **/
  allowDate?: boolean // JTD only
  /**
   * ### $comment
   *
   * Log or pass the value of `$comment` keyword to a function.
   *
   * Option values:
   *
   * - `false` (default): ignore \$comment keyword.
   * - `true`: log the keyword value to console.
   * - function: pass the keyword value, its schema path and root schema to the
   *   specified function
   **/
  $comment?:
    | true
    | ((comment: string, schemaPath?: string, rootSchema?: AnySchemaObject) => unknown)
  /**
   * ### formats
   *
   * An object with format definitions. Keys and values will be passed to
   * `addFormat` method. Pass `true` as format definition to ignore some
   * formats.
   **/
  formats?: {[Name in string]?: Format}
  /**
   * ### keywords
   *
   * An array of keyword definitions or strings. Values will be passed to
   * `addKeyword` method.
   **/
  keywords?: Vocabulary
  /**
   * ### schemas
   *
   * An array or object of schemas that will be added to the instance. In case you
   * pass the array the schemas must have IDs in them. When the object is passed
   * the method `addSchema(value, key)` will be called for each schema in this
   * object.
   **/
  schemas?: AnySchema[] | {[Key in string]?: AnySchema}
  /**
   * ### logger
   *
   * Sets the logging method. Default is the global `console` object that should
   * have methods `log`, `warn` and `error`. See [Error
   * logging](https://ajv.js.org/options.htmlerror-logging).
   *
   * Option values:
   *
   * - logger instance - it should have methods `log`, `warn` and `error`. If any
   *   of these methods is missing an exception will be thrown.
   * - `false` - logging is disabled.
   **/
  logger?: Logger | false
  /**
   * ### loadSchema
   *
   * Asynchronous function that will be used to load remote schemas when
   * `compileAsync` [method](https://ajv.js.org/options.htmlapi-compileAsync) is
   * used and some reference is missing (option `missingRefs` should NOT be
   * 'fail' or 'ignore'). This function should accept remote schema uri as a
   * parameter and return a Promise that resolves to a schema. See example in
   * [Asynchronous
   * compilation](https://ajv.js.org/guide/managing-schemas#asynchronous-schema-compilation).
   *
   * ## Options to modify validated data
   **/
  loadSchema?: (uri: string) => Promise<AnySchemaObject>

  // options to modify validated data:

  /**
   * ### removeAdditional
   *
   * Remove additional properties - see example in [Removing additional properties](https://ajv.js.org/guide/modifying-data#removing-additional-properties).
   *
   * This option is not used if schema is added with `addMetaSchema` method.
   *
   * Option values:
   *
   * - `false` (default) - not to remove additional properties
   * - `"all"` - all additional properties are removed, regardless of `additionalProperties` keyword in schema (and no validation is made for them).
   * - `true` - only additional properties with `additionalProperties` keyword equal to `false` are removed.
   * - `"failing"` - additional properties that fail schema validation will be removed (where `additionalProperties` keyword is `false` or schema).
   **/
  removeAdditional?: boolean | "all" | "failing"
  /**
   * ### useDefaults
   *
   * Replace missing or undefined properties and items with the values from corresponding `default` keywords. Default behaviour is to ignore `default` keywords. This option is not used if schema is added with `addMetaSchema` method.
   *
   * See examples in [Assigning defaults](https://ajv.js.org/guide/modifying-data#assigning-defaults).
   *
   * Option values:
   *
   * - `false` (default) - do not use defaults
   * - `true` - insert defaults by value (object literal is used).
   * - `"empty"` - in addition to missing or undefined, use defaults for properties and items that are equal to `null` or `""` (an empty string).
   **/
  useDefaults?: boolean | "empty"
  /**
   * ### coerceTypes
   *
   * Change data type of data to match `type` keyword. See the example in [Coercing data types](https://ajv.js.org/guide/modifying-data#coercing-data-types) and [coercion rules](https://ajv.js.org/coercion.html).
   *
   * Option values:
   *
   * - `false` (default) - no type coercion.
   * - `true` - coerce scalar data types.
   * - `"array"` - in addition to coercions between scalar types, coerce scalar data to an array with one element and vice versa (as required by the schema).
   **/
  coerceTypes?: boolean | "array"

  // advanced options:

  next?: boolean // NEW
  unevaluated?: boolean // NEW
  dynamicRef?: boolean // NEW
  schemaId?: "id" | "$id"
  jtd?: boolean // NEW
  /**
   * ### meta
   *
   * Add [meta-schema](http://json-schema.org/documentation.html) so it can be
   * used by other schemas (true by default). If an object is passed, it will be
   * used as the default meta-schema for schemas that have no `$schema` keyword.
   * This default meta-schema MUST have `$schema` keyword.
   **/
  meta?: SchemaObject | boolean
  defaultMeta?: string | AnySchemaObject
  /**
   * ### validateSchema
   *
   * Validate added/compiled schemas against meta-schema (true by default). `$schema` property in the schema can be http://json-schema.org/draft-07/schema or absent (draft-07 meta-schema will be used) or can be a reference to the schema previously added with `addMetaSchema` method.
   *
   * Option values:
   *
   * - `true` (default) - if the validation fails, throw the exception.
   * - `"log"` - if the validation fails, log error.
   * - `false` - skip schema validation.
   **/
  validateSchema?: boolean | "log"
  /**
   * ### addUsedSchema
   *
   * By default methods `compile` and `validate` add schemas to the instance if they have `$id` (or `id`) property that doesn't start with "#". If `$id` is present and it is not unique the exception will be thrown. Set this option to `false` to skip adding schemas to the instance and the `$id` uniqueness check when these methods are used. This option does not affect `addSchema` method.
   **/
  addUsedSchema?: boolean
  /**
   * ### inlineRefs
   *
   * Affects compilation of referenced schemas.
   *
   * Option values:
   *
   * - `true` (default) - the referenced schemas that don't have refs in them
   *   are inlined, regardless of their size - it improves performance.
   * - `false` - to not inline referenced schemas (they will always be compiled
   *   as separate functions).
   * - integer number - to limit the maximum number of keywords of the schema
   *   that will be inlined (to balance the total size of compiled functions and
   *   performance).
   **/
  inlineRefs?: boolean | number
  /**
   * ### passContext
   *
   * Pass validation context to _compile_ and _validate_ keyword functions. If
   * this option is `true` and you pass some context to the compiled validation
   * function with `validate.call(context, data)`, the `context` will be
   * available as `this` in your keywords. By default `this` is Ajv instance.
   **/
  passContext?: boolean
  /**
   * ### loopRequired
   *
   * By default `required` keyword is compiled into a single expression (or a sequence of statements in `allErrors` mode) up to 200 required properties. Pass integer to set a different number of properties above which `required` keyword will be validated in a loop (with a smaller validation function size and worse performance).
   **/
  loopRequired?: number
  /**
   * ### loopEnum
   *
   * By default `enum` keyword is compiled into a single expression with up to
   * 200 allowed values. Pass integer to set the number of values above which
   * `enum` keyword will be validated in a loop (with a smaller validation
   * function size and worse performance).
   *
   **/
  loopEnum?: number // NEW
  /**
   * ### ownProperties
   *
   * By default Ajv iterates over all enumerable object properties; when this option is `true` only own enumerable object properties (i.e. found directly on the object rather than on its prototype) are iterated. Contributed by @mbroadst.
   **/
  ownProperties?: boolean
  /**
   * ### multipleOfPrecision
   *
   * By default `multipleOf` keyword is validated by comparing the result of division with `parseInt()` of that result. It works for dividers that are bigger than 1. For small dividers such as 0.01 the result of the division is usually not integer (even when it should be integer, see issue [#84](https://github.com/ajv-validator/ajv/issues/84)). If you need to use fractional dividers set this option to some positive integer N to have `multipleOf` validated using this formula: `Math.abs(Math.round(division) - division) < 1e-N` (it is slower but allows for float arithmetic deviations).
   **/
  multipleOfPrecision?: number
  /**
   * ### int32range <Badge text="JTD only">
   *
   * Can be used to disable range checking for `int32` and `uint32` types.
   *
   * By default Ajv limits the range of these types to `[-2**31, 2**31 - 1]` for `int32` and to `[0, 2**32-1]` for `uint32` when validating and parsing.
   *
   * With option `int32range: false` Ajv only requires that `uint32` is non-negative, otherwise does not check the range. Parser will limit the number size to 16 digits (approx. `2**53` - safe integer range).
   *
   * #### *warning*
   * Option int32range is not portable
   * This option makes JTD validation and parsing more permissive and non-standard. The integers within a wider range will be accepted by Ajv, but will be rejected by other JTD validators.
   * :::
   **/
  int32range?: boolean // JTD only
  /**
   * ### messages
   *
   * Include human-readable messages in errors. `true` by default. `false` can be
   * passed when messages are generated outside of Ajv code (e.g. with
   * [ajv-i18n](https://github.com/ajv-validator/ajv-i18n)).
   **/
  messages?: boolean
  /**
   * ### code
   *
   * Code generation options
   *
   * see [CodeOptions](https://ajv.js.org/options.html#code)
   */
  code?: CodeOptions // NEW
}

export interface CodeOptions {
  /**
   * to generate es5 code - by default code is es6, with "for-of" loops, "let" and "const"
   */
  es5?: boolean
  /**
   * add line-breaks to code - to simplify debugging of generated functions
   */
  lines?: boolean
  /**
   * code optimization flag or number of passes, 1 pass by default,
   */
  optimize?: boolean | number
  /**
   * code to require (or construct) map of available formats - for standalone code
   */
  formats?: Code
  /**
   * add `source` property (seesSource) to validating function.
   */
  source?: boolean
  /**
   * an optional function to process generated code
   */
  process?: (code: string, schema?: SchemaEnv) => string
}

interface InstanceCodeOptions extends CodeOptions {
  optimize: number
}

interface DeprecatedOptions {
  /** @deprecated */
  ignoreKeywordsWithRef?: boolean
  /** @deprecated */
  jsPropertySyntax?: boolean // added instead of jsonPointers
  /** @deprecated */
  unicode?: boolean
}

interface RemovedOptions {
  format?: boolean
  errorDataPath?: "object" | "property"
  nullable?: boolean // "nullable" keyword is supported by default
  jsonPointers?: boolean
  extendRefs?: true | "ignore" | "fail"
  missingRefs?: true | "ignore" | "fail"
  processCode?: (code: string, schema?: SchemaEnv) => string
  sourceCode?: boolean
  strictDefaults?: boolean
  strictKeywords?: boolean
  uniqueItems?: boolean
  unknownFormats?: true | string[] | "ignore"
  cache?: any
  serialize?: (schema: AnySchema) => unknown
  ajvErrors?: boolean
}

type OptionsInfo<T extends RemovedOptions | DeprecatedOptions> = {
  [K in keyof T]-?: string | undefined
}

const removedOptions: OptionsInfo<RemovedOptions> = {
  errorDataPath: "",
  format: "`validateFormats: false` can be used instead.",
  nullable: '"nullable" keyword is supported by default.',
  jsonPointers: "Deprecated jsPropertySyntax can be used instead.",
  extendRefs: "Deprecated ignoreKeywordsWithRef can be used instead.",
  missingRefs: "Pass empty schema with $id that should be ignored to ajv.addSchema.",
  processCode: "Use option `code: {process: (code, schemaEnv: object) => string}`",
  sourceCode: "Use option `code: {source: true}`",
  strictDefaults: "It is default now, see option `strict`.",
  strictKeywords: "It is default now, see option `strict`.",
  uniqueItems: '"uniqueItems" keyword is always validated.',
  unknownFormats: "Disable strict mode or pass `true` to `ajv.addFormat` (or `formats` option).",
  cache: "Map is used as cache, schema object as key.",
  serialize: "Map is used as cache, schema object as key.",
  ajvErrors: "It is default now.",
}

const deprecatedOptions: OptionsInfo<DeprecatedOptions> = {
  ignoreKeywordsWithRef: "",
  jsPropertySyntax: "",
  unicode: '"minLength"/"maxLength" account for unicode characters by default.',
}

type RequiredInstanceOptions = {
  [K in
    | "strictSchema"
    | "strictNumbers"
    | "strictTypes"
    | "strictTuples"
    | "strictRequired"
    | "inlineRefs"
    | "loopRequired"
    | "loopEnum"
    | "meta"
    | "messages"
    | "schemaId"
    | "addUsedSchema"
    | "validateSchema"
    | "validateFormats"
    | "int32range"
    | "unicodeRegExp"]: NonNullable<Options[K]>
} & {code: InstanceCodeOptions}

export type InstanceOptions = Options & RequiredInstanceOptions

const MAX_EXPRESSION = 200

// eslint-disable-next-line complexity
function requiredOptions(o: Options): RequiredInstanceOptions {
  const s = o.strict
  const _optz = o.code?.optimize
  const optimize = _optz === true || _optz === undefined ? 1 : _optz || 0
  return {
    strictSchema: o.strictSchema ?? s ?? true,
    strictNumbers: o.strictNumbers ?? s ?? true,
    strictTypes: o.strictTypes ?? s ?? "log",
    strictTuples: o.strictTuples ?? s ?? "log",
    strictRequired: o.strictRequired ?? s ?? false,
    code: o.code ? {...o.code, optimize} : {optimize},
    loopRequired: o.loopRequired ?? MAX_EXPRESSION,
    loopEnum: o.loopEnum ?? MAX_EXPRESSION,
    meta: o.meta ?? true,
    messages: o.messages ?? true,
    inlineRefs: o.inlineRefs ?? true,
    schemaId: o.schemaId ?? "$id",
    addUsedSchema: o.addUsedSchema ?? true,
    validateSchema: o.validateSchema ?? true,
    validateFormats: o.validateFormats ?? true,
    unicodeRegExp: o.unicodeRegExp ?? true,
    int32range: o.int32range ?? true,
  }
}

export interface Logger {
  log(...args: unknown[]): unknown
  warn(...args: unknown[]): unknown
  error(...args: unknown[]): unknown
}

export default class Ajv {
  opts: InstanceOptions
  errors?: ErrorObject[] | null // errors from the last validation
  logger: Logger
  // shared external scope values for compiled functions
  readonly scope: ValueScope
  readonly schemas: {[Key in string]?: SchemaEnv} = {}
  readonly refs: {[Ref in string]?: SchemaEnv | string} = {}
  readonly formats: {[Name in string]?: AddedFormat} = {}
  readonly RULES: ValidationRules
  readonly _compilations: Set<SchemaEnv> = new Set()
  private readonly _loading: {[Ref in string]?: Promise<AnySchemaObject>} = {}
  private readonly _cache: Map<AnySchema, SchemaEnv> = new Map()
  private readonly _metaOpts: InstanceOptions

  static ValidationError = ValidationError
  static MissingRefError = MissingRefError

  constructor(opts: Options = {}) {
    opts = this.opts = {...opts, ...requiredOptions(opts)}
    const {es5, lines} = this.opts.code
    this.scope = new ValueScope({scope: {}, prefixes: EXT_SCOPE_NAMES, es5, lines})
    this.logger = getLogger(opts.logger)
    const formatOpt = opts.validateFormats
    opts.validateFormats = false

    this.RULES = getRules()
    checkOptions.call(this, removedOptions, opts, "NOT SUPPORTED")
    checkOptions.call(this, deprecatedOptions, opts, "DEPRECATED", "warn")
    this._metaOpts = getMetaSchemaOptions.call(this)

    if (opts.formats) addInitialFormats.call(this)
    this._addVocabularies()
    this._addDefaultMetaSchema()
    if (opts.keywords) addInitialKeywords.call(this, opts.keywords)
    if (typeof opts.meta == "object") this.addMetaSchema(opts.meta)
    addInitialSchemas.call(this)
    opts.validateFormats = formatOpt
  }

  _addVocabularies(): void {
    this.addKeyword("$async")
  }

  _addDefaultMetaSchema(): void {
    const {$data, meta, schemaId} = this.opts
    let _dataRefSchema: SchemaObject = $dataRefSchema
    if (schemaId === "id") {
      _dataRefSchema = {...$dataRefSchema}
      _dataRefSchema.id = _dataRefSchema.$id
      delete _dataRefSchema.$id
    }
    if (meta && $data) this.addMetaSchema(_dataRefSchema, _dataRefSchema[schemaId], false)
  }

  defaultMeta(): string | AnySchemaObject | undefined {
    const {meta, schemaId} = this.opts
    return (this.opts.defaultMeta = typeof meta == "object" ? meta[schemaId] || meta : undefined)
  }

  // Validate data using schema
  // AnySchema will be compiled and cached using schema itself as a key for Map
  validate(schema: Schema | string, data: unknown): boolean
  validate(schemaKeyRef: AnySchema | string, data: unknown): boolean | Promise<unknown>
  validate<T>(schema: Schema | JSONSchemaType<T> | string, data: unknown): data is T
  // Separated for type inference to work
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  validate<T>(schema: JTDSchemaType<T>, data: unknown): data is T
  // This overload is only intended for typescript inference, the first
  // argument prevents manual type annotation from matching this overload
  validate<N extends never, T extends SomeJTDSchemaType>(
    schema: T,
    data: unknown
  ): data is JTDDataType<T>
  validate<T>(schema: AsyncSchema, data: unknown | T): Promise<T>
  validate<T>(schemaKeyRef: AnySchema | string, data: unknown): data is T | Promise<T>
  validate<T>(
    schemaKeyRef: AnySchema | string, // key, ref or schema object
    data: unknown | T // to be validated
  ): boolean | Promise<T> {
    let v: AnyValidateFunction | undefined
    if (typeof schemaKeyRef == "string") {
      v = this.getSchema<T>(schemaKeyRef)
      if (!v) throw new Error(`no schema with key or ref "${schemaKeyRef}"`)
    } else {
      v = this.compile<T>(schemaKeyRef)
    }

    const valid = v(data)
    if (!("$async" in v)) this.errors = v.errors
    return valid
  }

  // Create validation function for passed schema
  // _meta: true if schema is a meta-schema. Used internally to compile meta schemas of user-defined keywords.
  compile<T = unknown>(schema: Schema | JSONSchemaType<T>, _meta?: boolean): ValidateFunction<T>
  // Separated for type inference to work
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  compile<T = unknown>(schema: JTDSchemaType<T>, _meta?: boolean): ValidateFunction<T>
  // This overload is only intended for typescript inference, the first
  // argument prevents manual type annotation from matching this overload
  compile<N extends never, T extends SomeJTDSchemaType>(
    schema: T,
    _meta?: boolean
  ): ValidateFunction<JTDDataType<T>>
  compile<T = unknown>(schema: AsyncSchema, _meta?: boolean): AsyncValidateFunction<T>
  compile<T = unknown>(schema: AnySchema, _meta?: boolean): AnyValidateFunction<T>
  compile<T = unknown>(schema: AnySchema, _meta?: boolean): AnyValidateFunction<T> {
    const sch = this._addSchema(schema, _meta)
    return (sch.validate || this._compileSchemaEnv(sch)) as AnyValidateFunction<T>
  }

  // Creates validating function for passed schema with asynchronous loading of missing schemas.
  // `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
  // TODO allow passing schema URI
  // meta - optional true to compile meta-schema
  compileAsync<T = unknown>(
    schema: SchemaObject | JSONSchemaType<T>,
    _meta?: boolean
  ): Promise<ValidateFunction<T>>
  // Separated for type inference to work
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  compileAsync<T = unknown>(schema: JTDSchemaType<T>, _meta?: boolean): Promise<ValidateFunction<T>>
  compileAsync<T = unknown>(schema: AsyncSchema, meta?: boolean): Promise<AsyncValidateFunction<T>>
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  compileAsync<T = unknown>(
    schema: AnySchemaObject,
    meta?: boolean
  ): Promise<AnyValidateFunction<T>>
  compileAsync<T = unknown>(
    schema: AnySchemaObject,
    meta?: boolean
  ): Promise<AnyValidateFunction<T>> {
    if (typeof this.opts.loadSchema != "function") {
      throw new Error("options.loadSchema should be a function")
    }
    const {loadSchema} = this.opts
    return runCompileAsync.call(this, schema, meta)

    async function runCompileAsync(
      this: Ajv,
      _schema: AnySchemaObject,
      _meta?: boolean
    ): Promise<AnyValidateFunction> {
      await loadMetaSchema.call(this, _schema.$schema)
      const sch = this._addSchema(_schema, _meta)
      return sch.validate || _compileAsync.call(this, sch)
    }

    async function loadMetaSchema(this: Ajv, $ref?: string): Promise<void> {
      if ($ref && !this.getSchema($ref)) {
        await runCompileAsync.call(this, {$ref}, true)
      }
    }

    async function _compileAsync(this: Ajv, sch: SchemaEnv): Promise<AnyValidateFunction> {
      try {
        return this._compileSchemaEnv(sch)
      } catch (e) {
        if (!(e instanceof MissingRefError)) throw e
        checkLoaded.call(this, e)
        await loadMissingSchema.call(this, e.missingSchema)
        return _compileAsync.call(this, sch)
      }
    }

    function checkLoaded(this: Ajv, {missingSchema: ref, missingRef}: MissingRefError): void {
      if (this.refs[ref]) {
        throw new Error(`AnySchema ${ref} is loaded but ${missingRef} cannot be resolved`)
      }
    }

    async function loadMissingSchema(this: Ajv, ref: string): Promise<void> {
      const _schema = await _loadSchema.call(this, ref)
      if (!this.refs[ref]) await loadMetaSchema.call(this, _schema.$schema)
      if (!this.refs[ref]) this.addSchema(_schema, ref, meta)
    }

    async function _loadSchema(this: Ajv, ref: string): Promise<AnySchemaObject> {
      const p = this._loading[ref]
      if (p) return p
      try {
        return await (this._loading[ref] = loadSchema(ref))
      } finally {
        delete this._loading[ref]
      }
    }
  }

  // Adds schema to the instance
  addSchema(
    schema: AnySchema | AnySchema[], // If array is passed, `key` will be ignored
    key?: string, // Optional schema key. Can be passed to `validate` method instead of schema object or id/ref. One schema per instance can have empty `id` and `key`.
    _meta?: boolean, // true if schema is a meta-schema. Used internally, addMetaSchema should be used instead.
    _validateSchema = this.opts.validateSchema // false to skip schema validation. Used internally, option validateSchema should be used instead.
  ): Ajv {
    if (Array.isArray(schema)) {
      for (const sch of schema) this.addSchema(sch, undefined, _meta, _validateSchema)
      return this
    }
    let id: string | undefined
    if (typeof schema === "object") {
      const {schemaId} = this.opts
      id = schema[schemaId]
      if (id !== undefined && typeof id != "string") {
        throw new Error(`schema ${schemaId} must be string`)
      }
    }
    key = normalizeId(key || id)
    this._checkUnique(key)
    this.schemas[key] = this._addSchema(schema, _meta, key, _validateSchema, true)
    return this
  }

  // Add schema that will be used to validate other schemas
  // options in META_IGNORE_OPTIONS are alway set to false
  addMetaSchema(
    schema: AnySchemaObject,
    key?: string, // schema key
    _validateSchema = this.opts.validateSchema // false to skip schema validation, can be used to override validateSchema option for meta-schema
  ): Ajv {
    this.addSchema(schema, key, true, _validateSchema)
    return this
  }

  //  Validate schema against its meta-schema
  validateSchema(schema: AnySchema, throwOrLogError?: boolean): boolean | Promise<unknown> {
    if (typeof schema == "boolean") return true
    let $schema: string | AnySchemaObject | undefined
    $schema = schema.$schema
    if ($schema !== undefined && typeof $schema != "string") {
      throw new Error("$schema must be a string")
    }
    $schema = $schema || this.opts.defaultMeta || this.defaultMeta()
    if (!$schema) {
      this.logger.warn("meta-schema not available")
      this.errors = null
      return true
    }
    const valid = this.validate($schema, schema)
    if (!valid && throwOrLogError) {
      const message = "schema is invalid: " + this.errorsText()
      if (this.opts.validateSchema === "log") this.logger.error(message)
      else throw new Error(message)
    }
    return valid
  }

  // Get compiled schema by `key` or `ref`.
  // (`key` that was passed to `addSchema` or full schema reference - `schema.$id` or resolved id)
  getSchema<T = unknown>(keyRef: string): AnyValidateFunction<T> | undefined {
    let sch
    while (typeof (sch = getSchEnv.call(this, keyRef)) == "string") keyRef = sch
    if (sch === undefined) {
      const {schemaId} = this.opts
      const root = new SchemaEnv({schema: {}, schemaId})
      sch = resolveSchema.call(this, root, keyRef)
      if (!sch) return
      this.refs[keyRef] = sch
    }
    return (sch.validate || this._compileSchemaEnv(sch)) as AnyValidateFunction<T> | undefined
  }

  // Remove cached schema(s).
  // If no parameter is passed all schemas but meta-schemas are removed.
  // If RegExp is passed all schemas with key/id matching pattern but meta-schemas are removed.
  // Even if schema is referenced by other schemas it still can be removed as other schemas have local references.
  removeSchema(schemaKeyRef?: AnySchema | string | RegExp): Ajv {
    if (schemaKeyRef instanceof RegExp) {
      this._removeAllSchemas(this.schemas, schemaKeyRef)
      this._removeAllSchemas(this.refs, schemaKeyRef)
      return this
    }
    switch (typeof schemaKeyRef) {
      case "undefined":
        this._removeAllSchemas(this.schemas)
        this._removeAllSchemas(this.refs)
        this._cache.clear()
        return this
      case "string": {
        const sch = getSchEnv.call(this, schemaKeyRef)
        if (typeof sch == "object") this._cache.delete(sch.schema)
        delete this.schemas[schemaKeyRef]
        delete this.refs[schemaKeyRef]
        return this
      }
      case "object": {
        const cacheKey = schemaKeyRef
        this._cache.delete(cacheKey)
        let id = schemaKeyRef[this.opts.schemaId]
        if (id) {
          id = normalizeId(id)
          delete this.schemas[id]
          delete this.refs[id]
        }
        return this
      }
      default:
        throw new Error("ajv.removeSchema: invalid parameter")
    }
  }

  // add "vocabulary" - a collection of keywords
  addVocabulary(definitions: Vocabulary): Ajv {
    for (const def of definitions) this.addKeyword(def)
    return this
  }

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
      if (Array.isArray(keyword) && !keyword.length) {
        throw new Error("addKeywords: keyword must be string or non-empty array")
      }
    } else {
      throw new Error("invalid addKeywords parameters")
    }

    checkKeyword.call(this, keyword, def)
    if (!def) {
      eachItem(keyword, (kwd) => addRule.call(this, kwd))
      return this
    }
    keywordMetaschema.call(this, def)
    const definition: AddedKeywordDefinition = {
      ...def,
      type: getJSONTypes(def.type),
      schemaType: getJSONTypes(def.schemaType),
    }
    eachItem(
      keyword,
      definition.type.length === 0
        ? (k) => addRule.call(this, k, definition)
        : (k) => definition.type.forEach((t) => addRule.call(this, k, definition, t))
    )
    return this
  }

  getKeyword(keyword: string): AddedKeywordDefinition | boolean {
    const rule = this.RULES.all[keyword]
    return typeof rule == "object" ? rule.definition : !!rule
  }

  // Remove keyword
  removeKeyword(keyword: string): Ajv {
    // TODO return type should be Ajv
    const {RULES} = this
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
      .map((e) => `${dataVar}${e.instancePath} ${e.message}`)
      .reduce((text, msg) => text + separator + msg)
  }

  $dataMetaSchema(metaSchema: AnySchemaObject, keywordsJsonPointers: string[]): AnySchemaObject {
    const rules = this.RULES.all
    metaSchema = JSON.parse(JSON.stringify(metaSchema))
    for (const jsonPointer of keywordsJsonPointers) {
      const segments = jsonPointer.split("/").slice(1) // first segment is an empty string
      let keywords = metaSchema
      for (const seg of segments) keywords = keywords[seg] as AnySchemaObject

      for (const key in rules) {
        const rule = rules[key]
        if (typeof rule != "object") continue
        const {$data} = rule.definition
        const schema = keywords[key] as AnySchemaObject | undefined
        if ($data && schema) keywords[key] = schemaOrData(schema)
      }
    }

    return metaSchema
  }

  private _removeAllSchemas(schemas: {[Ref in string]?: SchemaEnv | string}, regex?: RegExp): void {
    for (const keyRef in schemas) {
      const sch = schemas[keyRef]
      if (!regex || regex.test(keyRef)) {
        if (typeof sch == "string") {
          delete schemas[keyRef]
        } else if (sch && !sch.meta) {
          this._cache.delete(sch.schema)
          delete schemas[keyRef]
        }
      }
    }
  }

  _addSchema(
    schema: AnySchema,
    meta?: boolean,
    baseId?: string,
    validateSchema = this.opts.validateSchema,
    addSchema = this.opts.addUsedSchema
  ): SchemaEnv {
    let id: string | undefined
    const {schemaId} = this.opts
    if (typeof schema == "object") {
      id = schema[schemaId]
    } else {
      if (this.opts.jtd) throw new Error("schema must be object")
      else if (typeof schema != "boolean") throw new Error("schema must be object or boolean")
    }
    let sch = this._cache.get(schema)
    if (sch !== undefined) return sch

    const localRefs = getSchemaRefs.call(this, schema)
    baseId = normalizeId(id || baseId)
    sch = new SchemaEnv({schema, schemaId, meta, baseId, localRefs})
    this._cache.set(sch.schema, sch)
    if (addSchema && !baseId.startsWith("#")) {
      // TODO atm it is allowed to overwrite schemas without id (instead of not adding them)
      if (baseId) this._checkUnique(baseId)
      this.refs[baseId] = sch
    }
    if (validateSchema) this.validateSchema(schema, true)
    return sch
  }

  private _checkUnique(id: string): void {
    if (this.schemas[id] || this.refs[id]) {
      throw new Error(`schema with key or id "${id}" already exists`)
    }
  }

  private _compileSchemaEnv(sch: SchemaEnv): AnyValidateFunction {
    if (sch.meta) this._compileMetaSchema(sch)
    else compileSchema.call(this, sch)

    /* istanbul ignore if */
    if (!sch.validate) throw new Error("ajv implementation error")
    return sch.validate
  }

  private _compileMetaSchema(sch: SchemaEnv): void {
    const currentOpts = this.opts
    this.opts = this._metaOpts
    try {
      compileSchema.call(this, sch)
    } finally {
      this.opts = currentOpts
    }
  }
}

export interface ErrorsTextOptions {
  separator?: string
  dataVar?: string
}

function checkOptions(
  this: Ajv,
  checkOpts: OptionsInfo<RemovedOptions | DeprecatedOptions>,
  options: Options & RemovedOptions,
  msg: string,
  log: "warn" | "error" = "error"
): void {
  for (const key in checkOpts) {
    const opt = key as keyof typeof checkOpts
    if (opt in options) this.logger[log](`${msg}: option ${key}. ${checkOpts[opt]}`)
  }
}

function getSchEnv(this: Ajv, keyRef: string): SchemaEnv | string | undefined {
  keyRef = normalizeId(keyRef) // TODO tests fail without this line
  return this.schemas[keyRef] || this.refs[keyRef]
}

function addInitialSchemas(this: Ajv): void {
  const optsSchemas = this.opts.schemas
  if (!optsSchemas) return
  if (Array.isArray(optsSchemas)) this.addSchema(optsSchemas)
  else for (const key in optsSchemas) this.addSchema(optsSchemas[key] as AnySchema, key)
}

function addInitialFormats(this: Ajv): void {
  for (const name in this.opts.formats) {
    const format = this.opts.formats[name]
    if (format) this.addFormat(name, format)
  }
}

function addInitialKeywords(
  this: Ajv,
  defs: Vocabulary | {[K in string]?: KeywordDefinition}
): void {
  if (Array.isArray(defs)) {
    this.addVocabulary(defs)
    return
  }
  this.logger.warn("keywords option as map is deprecated, pass array")
  for (const keyword in defs) {
    const def = defs[keyword] as KeywordDefinition
    if (!def.keyword) def.keyword = keyword
    this.addKeyword(def)
  }
}

function getMetaSchemaOptions(this: Ajv): InstanceOptions {
  const metaOpts = {...this.opts}
  for (const opt of META_IGNORE_OPTIONS) delete metaOpts[opt]
  return metaOpts
}

const noLogs = {log() {}, warn() {}, error() {}}

function getLogger(logger?: Partial<Logger> | false): Logger {
  if (logger === false) return noLogs
  if (logger === undefined) return console
  if (logger.log && logger.warn && logger.error) return logger as Logger
  throw new Error("logger must implement log, warn and error methods")
}

const KEYWORD_NAME = /^[a-z_$][a-z0-9_$:-]*$/i

function checkKeyword(this: Ajv, keyword: string | string[], def?: KeywordDefinition): void {
  const {RULES} = this
  eachItem(keyword, (kwd) => {
    if (RULES.keywords[kwd]) throw new Error(`Keyword ${kwd} is already defined`)
    if (!KEYWORD_NAME.test(kwd)) throw new Error(`Keyword ${kwd} has invalid name`)
  })
  if (!def) return
  if (def.$data && !("code" in def || "validate" in def)) {
    throw new Error('$data keyword must have "code" or "validate" function')
  }
}

function addRule(
  this: Ajv,
  keyword: string,
  definition?: AddedKeywordDefinition,
  dataType?: JSONType
): void {
  const post = definition?.post
  if (dataType && post) throw new Error('keyword with "post" flag cannot have "type"')
  const {RULES} = this
  let ruleGroup = post ? RULES.post : RULES.rules.find(({type: t}) => t === dataType)
  if (!ruleGroup) {
    ruleGroup = {type: dataType, rules: []}
    RULES.rules.push(ruleGroup)
  }
  RULES.keywords[keyword] = true
  if (!definition) return

  const rule: Rule = {
    keyword,
    definition: {
      ...definition,
      type: getJSONTypes(definition.type),
      schemaType: getJSONTypes(definition.schemaType),
    },
  }
  if (definition.before) addBeforeRule.call(this, ruleGroup, rule, definition.before)
  else ruleGroup.rules.push(rule)
  RULES.all[keyword] = rule
  definition.implements?.forEach((kwd) => this.addKeyword(kwd))
}

function addBeforeRule(this: Ajv, ruleGroup: RuleGroup, rule: Rule, before: string): void {
  const i = ruleGroup.rules.findIndex((_rule) => _rule.keyword === before)
  if (i >= 0) {
    ruleGroup.rules.splice(i, 0, rule)
  } else {
    ruleGroup.rules.push(rule)
    this.logger.warn(`rule ${before} is not defined`)
  }
}

function keywordMetaschema(this: Ajv, def: KeywordDefinition): void {
  let {metaSchema} = def
  if (metaSchema === undefined) return
  if (def.$data && this.opts.$data) metaSchema = schemaOrData(metaSchema)
  def.validateSchema = this.compile(metaSchema, true)
}

const $dataRef = {
  $ref: "https://raw.githubusercontent.com/ajv-validator/ajv/master/lib/refs/data.json#",
}

function schemaOrData(schema: AnySchema): AnySchemaObject {
  return {anyOf: [schema, $dataRef]}
}
