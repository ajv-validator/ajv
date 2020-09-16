import type {CodeGen, Code, Name, CodeGenOptions, Scope} from "../compile/codegen"
import type {SchemaEnv} from "../compile"
import type KeywordCxt from "../compile/context"
import type Ajv from "../ajv"

export interface SchemaObject {
  $id?: string
  $async?: boolean
  $schema?: string
  [x: string]: any // TODO
}

export type Schema = SchemaObject | boolean

export interface SchemaMap {
  [key: string]: Schema | undefined
}

export type LoadSchemaFunction = (
  uri: string,
  cb?: (err: Error | null, schema?: SchemaObject) => void
) => Promise<SchemaObject>

export interface CurrentOptions {
  strict?: boolean | "log"
  $data?: boolean
  allErrors?: boolean
  verbose?: boolean
  format?: false
  formats?: {[name: string]: Format}
  keywords?: Vocabulary | {[x: string]: KeywordDefinition} // map is deprecated
  unknownFormats?: true | string[] | "ignore"
  schemas?: Schema[] | {[key: string]: Schema}
  missingRefs?: true | "ignore" | "fail"
  extendRefs?: true | "ignore" | "fail"
  loadSchema?: LoadSchemaFunction
  removeAdditional?: boolean | "all" | "failing"
  useDefaults?: boolean | "empty"
  coerceTypes?: boolean | "array"
  meta?: SchemaObject | boolean
  defaultMeta?: string | SchemaObject
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
  serialize?: false | ((schema: Schema) => unknown)
  $comment?: true | ((comment: string, schemaPath?: string, rootSchema?: SchemaObject) => unknown)
  allowMatchingProperties?: boolean // disables a strict mode restriction
}

export interface CodeOptions {
  formats?: Code // code to require (or construct) map of available formats - for standalone code
}

export interface Options extends CurrentOptions {
  // removed:
  errorDataPath?: "object" | "property"
  nullable?: boolean // "nullable" keyword is supported by default
  schemaId?: string
  uniqueItems?: boolean
  // deprecated:
  jsPropertySyntax?: boolean // added instead of jsonPointers
  unicode?: boolean
}

export interface InstanceOptions extends Options {
  [opt: string]: unknown
  strict: boolean | "log"
  code: CodeOptions
  loopRequired: number
  loopEnum: number
  serialize: (schema: Schema) => unknown
  addUsedSchema: boolean
  validateSchema: boolean | "log"
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

export interface ValidateGuard<T> extends _ValidateFuncProps {
  (
    this: Ajv | any,
    data: any,
    dataPath?: string,
    parentData?: Record<string, any> | any[],
    parentDataProperty?: string | number,
    rootData?: Record<string, any> | any[]
  ): data is T
}

interface _ValidateFunction<T extends boolean | Promise<any>> extends _ValidateFuncProps {
  (...args: Parameters<ValidateGuard<any>>): T
  $async?: true
}

interface _ValidateFuncProps {
  schema?: Schema
  errors?: null | ErrorObject[]
  schemaEnv?: SchemaEnv
  source?: SourceCode
}

export type ValidateFunction = _ValidateFunction<boolean | Promise<any>>

export interface SyncSchemaObject extends SchemaObject {
  $async?: false | undefined
}

export interface SyncValidateFunction extends _ValidateFunction<boolean> {
  $async: undefined
}

export interface AsyncSchemaObject extends SchemaObject {
  $async: true
}

export interface AsyncValidateFunction extends _ValidateFunction<Promise<any>> {
  $async: true
}

export interface SchemaValidateFunction {
  (
    schema: any,
    data: any,
    parentSchema?: SchemaObject,
    dataPath?: string,
    parentData?: Record<string, any> | any[],
    parentDataProperty?: string | number,
    rootData?: Record<string, any> | any[]
  ): boolean | Promise<any>
  errors?: Partial<ErrorObject>[]
}

export interface ErrorObject {
  keyword: string
  dataPath: string
  schemaPath: string
  params: Record<string, unknown> // TODO add interface
  // Added to validation errors of propertyNames keyword schema
  propertyName?: string
  // Excluded if messages set to false.
  message?: string
  // These are added with the `verbose` option.
  schema?: unknown
  parentSchema?: SchemaObject
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
  schema: Schema
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
  schema: SchemaObject
}

interface _KeywordDef {
  keyword: string | string[]
  type?: string | string[]
  schemaType?: string | string[]
  $data?: boolean
  implements?: string[]
  before?: string
  metaSchema?: SchemaObject
  validateSchema?: ValidateFunction // compiled keyword metaSchema - should not be passed
  dependencies?: string[] // keywords that must be present in the same schema
  error?: KeywordErrorDefinition
  $dataError?: KeywordErrorDefinition
}

export interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordCxt, ruleType?: string) => void
  trackErrors?: boolean
}

export type MacroKeywordFunc = (schema: any, parentSchema: SchemaObject, it: SchemaCxt) => Schema

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: SchemaObject,
  it: SchemaObjCxt
) => ValidateFunction

export interface FuncKeywordDefinition extends _KeywordDef {
  validate?: SchemaValidateFunction | ValidateFunction
  compile?: CompileKeywordFunc
  // schema: false makes validate not to expect schema (ValidateFunction)
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
  parentSchema?: SchemaObject
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
  | RegExp
  | FormatValidator<string>
  | FormatDefinition<string>
  | FormatDefinition<number>
  | AsyncFormatDefinition<string>
  | AsyncFormatDefinition<number>

export type Format = AddedFormat | string
