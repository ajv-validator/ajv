import Cache from "./cache"
import CodeGen from "./compile/codegen"
import {ValidationRules} from "./compile/rules"
import {MissingRefError} from "./compile/error_classes"
import {ResolvedRef} from "./compile"

export interface Options {
  $data?: boolean
  allErrors?: boolean
  verbose?: boolean
  jsonPointers?: boolean
  uniqueItems?: boolean
  unicode?: boolean
  format?: false | string
  formats?: object
  keywords?: object
  unknownFormats?: true | string[] | "ignore"
  schemas?: object[] | object
  missingRefs?: true | "ignore" | "fail"
  extendRefs?: true | "ignore" | "fail"
  loadSchema?: (
    uri: string,
    cb?: (err: Error, schema: object) => void
  ) => PromiseLike<object | boolean>
  removeAdditional?: boolean | "all" | "failing"
  useDefaults?: boolean | "empty" | "shared"
  coerceTypes?: boolean | "array"
  strictDefaults?: boolean | "log"
  strictKeywords?: boolean | "log"
  strictNumbers?: boolean
  async?: boolean | string
  transpile?: string | ((code: string) => string)
  meta?: boolean | object
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
  processCode?: (code: string, schema: object) => string
  cache?: Cache
  logger?: Logger | false
  nullable?: boolean
  serialize?: false | ((schema: object | boolean) => any)
  $comment?: true | ((comment: string, schemaPath?: string, rootSchema?: any) => any)
  schemaId?: string // not supported
}

interface Logger {
  log(...args: any[]): any
  warn(...args: any[]): any
  error(...args: any[]): any
}

export interface ValidateFunction {
  (
    data: any,
    dataPath?: string,
    parentData?: object | any[],
    parentDataProperty?: string | number,
    rootData?: object | any[]
  ): boolean | PromiseLike<any>
  schema?: object | boolean
  errors?: null | ErrorObject[]
  refs?: object
  refVal?: any[]
  root?: ValidateFunction | object
  $async?: true
  source?: object
}

export interface SchemaValidateFunction {
  (
    schema: any,
    data: any,
    parentSchema?: object,
    dataPath?: string,
    parentData?: object | any[],
    parentDataProperty?: string | number,
    rootData?: object | any[]
  ): boolean | PromiseLike<any>
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
  parentSchema?: object
  data?: any
}

export type KeywordCompilationResult = object | boolean | SchemaValidateFunction | ValidateFunction

export interface CompilationContext {
  allErrors: boolean
  level: number
  dataLevel: number
  data: string
  dataPathArr: (string | number)[]
  schema: any
  isRoot: boolean
  schemaPath: string
  errorPath: string
  errSchemaPath: string
  propertyName?: string
  gen: CodeGen
  createErrors?: boolean // TODO maybe remove later
  baseId: string
  async: boolean
  opts: Options
  formats: {
    [index: string]: AddedFormat
  }
  // keywords: {
  //   [index: string]: KeywordDefinition | undefined
  // }
  compositeRule?: boolean
  validateCode: (it: CompilationContext) => string | void // TODO remove string
  usePattern: (str: string) => string
  useDefault: (value: any) => string
  customRules: KeywordCompilationResult[]
  validateKeywordSchema: (it: CompilationContext, keyword: string, def: KeywordDefinition) => void // TODO remove
  util: any // TODO
  self: any // TODO
  RULES: ValidationRules
  logger: Logger // TODO ?
  isTop: boolean // TODO ?
  root: SchemaRoot // TODO ?
  rootId: string // TODO ?
  topSchemaRef: string
  MissingRefError: typeof MissingRefError
  resolve: any
  resolveRef: (...args: any[]) => ResolvedRef | void
}

interface SchemaRoot {
  schema: any
  refVal: (string | undefined)[] // TODO
  refs: {[key: string]: any} // TODO
}

interface _KeywordDef {
  keyword?: string | string[]
  type?: string | string[]
  schemaType?: string | string[]
  $data?: boolean // requires "validate" or "code"
  implements?: string[]
  before?: string
  metaSchema?: object
  validateSchema?: ValidateFunction // compiled keyword metaSchema - should not be passed
  dependencies?: string[] // keywords that must be present in the same schema
}

interface FuncKeywordDef extends _KeywordDef {
  validate?: SchemaValidateFunction | ValidateFunction
  // schema: false makes validate not to expect schema (ValidateFunction)
  schema?: boolean // requires "validate"
  errors?: boolean | "full"
}

export interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordContext, ruleType?: string, def?: KeywordDefinition) => string | void
  error?: KeywordErrorDefinition
}

export type MacroKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
) => object | boolean

export interface MacroKeywordDefinition extends FuncKeywordDef {
  macro: MacroKeywordFunc
}

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
) => ValidateFunction

export type FuncKeywordDefinition = CompiledKeywordDefinition | ValidatedKeywordDefinition

export interface CompiledKeywordDefinition extends FuncKeywordDef {
  compile: CompileKeywordFunc
  modifying?: boolean
  async?: boolean
  valid?: boolean
}

export interface ValidatedKeywordDefinition extends FuncKeywordDef {
  validate: SchemaValidateFunction | ValidateFunction
  modifying?: boolean
  async?: boolean
  valid?: boolean
}

export type KeywordDefinition =
  | MacroKeywordDefinition
  | CompiledKeywordDefinition
  | ValidatedKeywordDefinition
  | CodeKeywordDefinition

export interface KeywordErrorDefinition {
  message: string | ((cxt: KeywordContext) => string)
  params?: (cxt: KeywordContext) => string
}

export type Vocabulary = KeywordDefinition[]

export interface KeywordContext {
  gen: CodeGen
  fail: (condition?: string, context?: KeywordContext) => void
  ok: (condition?: string) => void
  errorParams: (obj: KeywordContextParams, assing?: true) => void
  keyword: string
  data: string
  $data?: string | false
  schema: any
  parentSchema: any
  schemaCode: string | number | boolean
  schemaValue: string | number | boolean
  params: KeywordContextParams
  it: CompilationContext
}

export type KeywordContextParams = {[x: string]: string}

export type FormatMode = "fast" | "full"

type SN = string | number

export type FormatValidator<T extends SN> = (data: T) => boolean

export type FormatCompare<T extends SN> = (data1: T, data2: T) => boolean

export type AsyncFormatValidator<T extends SN> = (data: T) => PromiseLike<boolean>

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
