import type {CodeGen, Code, Name, CodeGenOptions, Scope} from "../compile/codegen"
import type {SchemaEnv} from "../compile"
import type KeywordCxt from "../compile/context"
import type Ajv from "../ajv"

interface _SchemaObject {
  $id?: string
  $schema?: string
  [x: string]: any // TODO
}

export interface SchemaObject extends _SchemaObject {
  $id?: string
  $schema?: string
  $async?: false
  [x: string]: any // TODO
}

export interface AsyncSchema extends _SchemaObject {
  $async: true
}

export type AnySchemaObject = SchemaObject | AsyncSchema

export type Schema = SchemaObject | boolean

export type AnySchema = Schema | AsyncSchema

export interface SchemaMap {
  [key: string]: AnySchema | undefined
}

export type LoadSchemaFunction = (
  uri: string,
  cb?: (err: Error | null, schema?: AnySchemaObject) => void
) => Promise<AnySchemaObject>

export type Options = CurrentOptions & DeprecatedOptions

export interface CurrentOptions {
  strict?: boolean | "log"
  $data?: boolean
  allErrors?: boolean
  verbose?: boolean
  formats?: {[name: string]: Format}
  keywords?: Vocabulary | {[x: string]: KeywordDefinition} // map is deprecated
  schemas?: AnySchema[] | {[key: string]: AnySchema}
  missingRefs?: true | "ignore" | "fail"
  extendRefs?: true | "ignore" | "fail"
  loadSchema?: LoadSchemaFunction
  removeAdditional?: boolean | "all" | "failing"
  useDefaults?: boolean | "empty"
  coerceTypes?: boolean | "array"
  meta?: SchemaObject | boolean
  defaultMeta?: string | AnySchemaObject
  validateSchema?: boolean | "log"
  addUsedSchema?: boolean
  inlineRefs?: boolean | number
  passContext?: boolean
  loopRequired?: number
  loopEnum?: number
  ownProperties?: boolean
  multipleOfPrecision?: boolean | number
  messages?: boolean
  code?: CodeOptions
  sourceCode?: boolean
  processCode?: (code: string, schema?: SchemaEnv) => string
  codegen?: CodeGenOptions
  cache?: CacheInterface
  logger?: Logger | false
  serialize?: false | ((schema: AnySchema) => unknown)
  $comment?:
    | true
    | ((comment: string, schemaPath?: string, rootSchema?: AnySchemaObject) => unknown)
  allowMatchingProperties?: boolean // disables a strict mode restriction
  validateFormats?: boolean
}

export interface CodeOptions {
  formats?: Code // code to require (or construct) map of available formats - for standalone code
}

export interface DeprecatedOptions {
  jsPropertySyntax?: boolean // added instead of jsonPointers
  unicode?: boolean
}

export interface RemovedOptions {
  format?: boolean
  errorDataPath?: "object" | "property"
  nullable?: boolean // "nullable" keyword is supported by default
  jsonPointers?: boolean
  schemaId?: string
  strictDefaults?: boolean
  strictKeywords?: boolean
  strictNumbers?: boolean
  uniqueItems?: boolean
  unknownFormats?: true | string[] | "ignore"
}

export interface InstanceOptions extends Options {
  strict: boolean | "log"
  code: CodeOptions
  loopRequired: number
  loopEnum: number
  meta: SchemaObject | boolean
  messages: boolean
  inlineRefs: boolean | number
  serialize: (schema: AnySchema) => unknown
  addUsedSchema: boolean
  validateSchema: boolean | "log"
  validateFormats: boolean
}

export interface Logger {
  log(...args: unknown[]): unknown
  warn(...args: unknown[]): unknown
  error(...args: unknown[]): unknown
}

export interface CacheInterface {
  put(key: unknown, value: SchemaEnv): void
  get(key: unknown): SchemaEnv | undefined
  del(key: unknown): void
  clear(): void
}

interface SourceCode {
  code: string
  scope: Scope
}

export interface ValidateFunction<T = unknown> {
  (
    this: Ajv | any,
    data: any,
    dataPath?: string,
    parentData?: Record<string, any> | any[],
    parentDataProperty?: string | number,
    rootData?: Record<string, any> | any[]
  ): data is T
  errors?: null | ErrorObject[]
  schema?: AnySchema
  schemaEnv?: SchemaEnv
  source?: SourceCode
}

export interface AsyncValidateFunction<T = unknown> extends ValidateFunction<T> {
  (...args: Parameters<ValidateFunction<T>>): Promise<T>
  $async: true
}

export type AnyValidateFunction<T = any> = ValidateFunction<T> | AsyncValidateFunction<T>

export interface ErrorObject<K = string, P = Record<string, any>> {
  keyword: K
  dataPath: string
  schemaPath: string
  params: P
  // Added to validation errors of "propertyNames" keyword schema
  propertyName?: string
  // Excluded if option `messages` set to false.
  message?: string
  // These are added with the `verbose` option.
  schema?: unknown
  parentSchema?: AnySchemaObject
  data?: unknown
}

export interface SchemaCxt {
  gen: CodeGen
  allErrors?: boolean
  data: Name
  parentData: Name
  parentDataProperty: Code | number
  dataNames: Name[]
  dataPathArr: (Code | number)[]
  dataLevel: number
  topSchemaRef: Code
  validateName: Name
  ValidationError?: Name
  schema: AnySchema
  schemaEnv: SchemaEnv
  rootId: string // TODO ?
  baseId: string
  schemaPath: Code
  errSchemaPath: string // this is actual string, should not be changed to Code
  errorPath: Code
  propertyName?: Name
  compositeRule?: boolean
  createErrors?: boolean
  opts: InstanceOptions
  self: Ajv
}

export interface SchemaObjCxt extends SchemaCxt {
  schema: AnySchemaObject
}

interface _KeywordDef {
  keyword: string | string[]
  type?: string | string[]
  schemaType?: string | string[]
  $data?: boolean
  implements?: string[]
  before?: string
  metaSchema?: AnySchemaObject
  validateSchema?: AnyValidateFunction // compiled keyword metaSchema - should not be passed
  dependencies?: string[] // keywords that must be present in the same schema
  error?: KeywordErrorDefinition
  $dataError?: KeywordErrorDefinition
}

export interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordCxt, ruleType?: string) => void
  trackErrors?: boolean
}

export type MacroKeywordFunc = (
  schema: any,
  parentSchema: AnySchemaObject,
  it: SchemaCxt
) => AnySchema

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: AnySchemaObject,
  it: SchemaObjCxt
) => DataValidateFunction

export interface DataValidateFunction {
  (...args: Parameters<ValidateFunction>): boolean | Promise<any>
  errors?: Partial<ErrorObject>[]
}

export interface SchemaValidateFunction {
  (
    schema: any,
    data: any,
    parentSchema?: AnySchemaObject,
    dataPath?: string,
    parentData?: Record<string, any> | any[],
    parentDataProperty?: string | number,
    rootData?: Record<string, any> | any[]
  ): boolean | Promise<any>
  errors?: Partial<ErrorObject>[]
}

export interface FuncKeywordDefinition extends _KeywordDef {
  validate?: SchemaValidateFunction | DataValidateFunction
  compile?: CompileKeywordFunc
  // schema: false makes validate not to expect schema (DataValidateFunction)
  schema?: boolean // requires "validate"
  modifying?: boolean
  async?: boolean
  valid?: boolean
  errors?: boolean | "full"
}

export interface MacroKeywordDefinition extends FuncKeywordDefinition {
  macro: MacroKeywordFunc
}

export type KeywordDefinition =
  | CodeKeywordDefinition
  | FuncKeywordDefinition
  | MacroKeywordDefinition

export interface KeywordErrorDefinition {
  message: string | ((cxt: KeywordErrorCxt) => Code)
  params?: (cxt: KeywordErrorCxt) => Code
}

export type Vocabulary = (KeywordDefinition | string)[]

export interface KeywordErrorCxt {
  gen: CodeGen
  keyword: string
  data: Name
  $data?: string | false
  schema: any // TODO
  parentSchema?: AnySchemaObject
  schemaCode: Code | number | boolean
  schemaValue: Code | number | boolean
  schemaType?: string | string[]
  errsCount?: Name
  params: KeywordCxtParams
  it: SchemaCxt
}

export interface KeywordCxtParams {
  [x: string]: Code | string | number | undefined
}

export type FormatValidator<T extends string | number> = (data: T) => boolean

export type FormatCompare<T extends string | number> = (data1: T, data2: T) => boolean

export type AsyncFormatValidator<T extends string | number> = (data: T) => Promise<boolean>

export interface FormatDefinition<T extends string | number> {
  type: T extends string ? "string" | undefined : "number"
  validate: FormatValidator<T> | (T extends string ? string | RegExp : never)
  async?: false | undefined
  compare?: FormatCompare<T>
}

export interface AsyncFormatDefinition<T extends string | number> {
  type: T extends string ? "string" | undefined : "number"
  validate: AsyncFormatValidator<T>
  async: true
  compare?: FormatCompare<T>
}

export type AddedFormat =
  | true
  | RegExp
  | FormatValidator<string>
  | FormatDefinition<string>
  | FormatDefinition<number>
  | AsyncFormatDefinition<string>
  | AsyncFormatDefinition<number>

export type Format = AddedFormat | string
