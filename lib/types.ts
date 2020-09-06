import CodeGen, {Code, Name, CodeGenOptions, Scope} from "./compile/codegen"
import {ValidationRules} from "./compile/rules"
import {RefVal, ResolvedRef, SchemaRoot, StoredSchema} from "./compile"
import KeywordCtx from "./compile/context"
import Ajv from "./ajv"

export interface SchemaObject {
  $id?: string
  $schema?: string
  [x: string]: any
}

export type Schema = SchemaObject | boolean

export interface SchemaMap {
  [key: string]: Schema
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
  meta?: SchemaObject | false
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
  sourceCode?: boolean
  processCode?: (code: string, schema: Schema) => string
  codegen?: CodeGenOptions
  cache?: CacheInterface
  logger?: Logger | false
  serialize?: false | ((schema: Schema) => any)
  $comment?: true | ((comment: string, schemaPath?: string, rootSchema?: SchemaObject) => any)
  allowMatchingProperties?: boolean // disables a strict mode restriction
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

export interface Logger {
  log(...args: any[]): any
  warn(...args: any[]): any
  error(...args: any[]): any
}

export interface CacheInterface {
  put: (key: any, value: StoredSchema) => void
  get: (key: any) => StoredSchema
  del(key: any): void
  clear(): void
}

interface SourceCode {
  code: string
  scope: Scope
}

export interface ValidateFunction {
  (
    this: Ajv | any,
    data: any,
    dataPath?: string,
    parentData?: object | any[],
    parentDataProperty?: string | number,
    rootData?: object | any[]
  ): boolean | Promise<any>
  schema?: Schema
  errors?: null | ErrorObject[]
  refs?: {[ref: string]: number | undefined}
  refVal?: (RefVal | undefined)[]
  root?: SchemaRoot
  $async?: true
  source?: SourceCode
}

export interface ValidateWrapper extends ValidateFunction {
  validate?: ValidateFunction
}

export interface SchemaValidateFunction {
  (
    schema: any,
    data: any,
    parentSchema?: SchemaObject,
    dataPath?: string,
    parentData?: object | any[],
    parentDataProperty?: string | number,
    rootData?: object | any[]
  ): boolean | Promise<any>
  errors?: ErrorObject[]
}

export interface ErrorObject {
  keyword: string
  dataPath: string
  schemaPath: string
  params: object // TODO add interface
  // Added to validation errors of propertyNames keyword schema
  propertyName?: string
  // Excluded if messages set to false.
  message?: string
  // These are added with the `verbose` option.
  schema?: any
  parentSchema?: SchemaObject
  data?: any
}

export type KeywordCompilationResult = object | boolean | SchemaValidateFunction | ValidateFunction

export interface SchemaCtx {
  gen: CodeGen
  allErrors: boolean
  data: Name
  parentData: Name
  parentDataProperty: Code | number
  dataNames: Name[]
  dataPathArr: (Code | number)[]
  dataLevel: number
  topSchemaRef: Code
  async: boolean
  schema: Schema
  isRoot: boolean
  root: SchemaRoot
  rootId: string // TODO ?
  baseId: string
  schemaPath: Code
  errSchemaPath: string // this is actual string, should not be changed to Code
  errorPath: Code
  propertyName?: Name
  compositeRule?: boolean
  createErrors?: boolean // TODO maybe remove later
  RULES: ValidationRules
  formats: {[index: string]: AddedFormat}
  opts: Options
  resolveRef: (baseId: string, ref: string, isRoot: boolean) => ResolvedRef | void
  logger: Logger
  self: Ajv
}

export interface SchemaObjCtx extends SchemaCtx {
  schema: SchemaObject
}

interface _KeywordDef {
  keyword: string | string[]
  type?: string | string[]
  schemaType?: string | string[]
  $data?: boolean
  implements?: string[]
  before?: string
  metaSchema?: object
  validateSchema?: ValidateFunction // compiled keyword metaSchema - should not be passed
  dependencies?: string[] // keywords that must be present in the same schema
  error?: KeywordErrorDefinition
  $dataError?: KeywordErrorDefinition
}

export interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordCtx, ruleType?: string) => void
  trackErrors?: boolean
}

export type MacroKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: SchemaCtx
) => object | boolean

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: SchemaCtx
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
  message: string | ((cxt: KeywordErrorCtx) => Code)
  params?: (cxt: KeywordErrorCtx) => Code
}

export type Vocabulary = (KeywordDefinition | string)[]

export interface KeywordErrorCtx {
  gen: CodeGen
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  parentSchema?: SchemaObject
  schemaCode: Code | number | boolean
  schemaValue: Code | number | boolean
  schemaType?: string | string[]
  errsCount?: Name
  params: KeywordCtxParams
  it: SchemaCtx
}

export type KeywordCtxParams = {[x: string]: Code | string | number}

export type FormatMode = "fast" | "full"

type SN = string | number

export type FormatValidator<T extends SN> = (data: T) => boolean

export type FormatCompare<T extends SN> = (data1: T, data2: T) => boolean

export type AsyncFormatValidator<T extends SN> = (data: T) => Promise<boolean>

export interface FormatDefinition<T extends SN> {
  type: T extends string ? "string" : "number"
  validate: FormatValidator<T> | (T extends string ? string | RegExp : never)
  async?: false | undefined
  compare?: FormatCompare<T>
}

export interface AsyncFormatDefinition<T extends SN> {
  type: T extends string ? "string" : "number"
  validate: AsyncFormatValidator<T>
  async: true
  compare?: FormatCompare<T>
}

export type FormatValidate = FormatValidator<any> | AsyncFormatValidator<any> | RegExp

export type AddedFormat =
  | RegExp
  | FormatValidator<string>
  | FormatDefinition<any>
  | AsyncFormatDefinition<any>

export type Format = AddedFormat | string
