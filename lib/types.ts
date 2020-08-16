import Cache from "./cache"
import CodeGen from "./compile/codegen"
import {ValidationRules, Rule} from "./compile/rules"
import {MissingRefError} from "./compile/error_classes"

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
  errorDataPath?: string
  messages?: boolean
  sourceCode?: boolean
  processCode?: (code: string, schema: object) => string
  cache?: Cache
  logger?: Logger | false
  nullable?: boolean
  serialize?: false | ((schema: object | boolean) => any)
  $comment?: true | ((comment: string, schemaPath?: string, rootSchema?: any) => any)
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

export interface CompilationContext {
  level: number
  dataLevel: number
  data: string
  dataPathArr: string[]
  schema: any
  isRoot: boolean
  schemaPath: string
  errorPath: string
  errSchemaPath: string
  gen: CodeGen
  createErrors?: boolean // TODO maybe remove later
  baseId?: string // TODO probably not optional
  async: boolean
  opts: Options
  formats: {
    [index: string]: Format | undefined
  }
  // keywords: {
  //   [index: string]: KeywordDefinition | undefined
  // }
  compositeRule?: boolean
  validate: (it: CompilationContext) => string
  usePattern: (str: string) => string
  useDefault: (value: any) => string
  useCustomRule: (rule: Rule, schema: any, parentSchema: object, it: CompilationContext) => any
  util: object // TODO
  self: object // TODO
  RULES: ValidationRules
  logger: Logger // TODO ?
  isTop: boolean // TODO ?
  root: SchemaRoot // TODO ?
  rootId?: string // TODO ?
  MissingRefError: typeof MissingRefError
  resolve: any
  resolveRef: (...args: any[]) => any
}

interface SchemaRoot {
  schema: any
  refVal: (string | undefined)[] // TODO
  refs: {[key: string]: any} // TODO
}

export interface KeywordDefinition {
  keyword?: string | string[]
  type?: string | string[]
  schemaType?: string
  async?: boolean
  $data?: boolean
  errors?: boolean | "full"
  metaSchema?: object
  // schema: false makes validate not to expect schema (ValidateFunction)
  schema?: boolean
  statements?: boolean
  dependencies?: string[]
  modifying?: boolean
  valid?: boolean
  // at least one of the following properties should be present
  validate?: SchemaValidateFunction | ValidateFunction
  compile?: (schema: any, parentSchema: object, it: CompilationContext) => ValidateFunction
  macro?: (schema: any, parentSchema: object, it: CompilationContext) => object | boolean
  inline?: (it: CompilationContext, keyword: string, schema: any, parentSchema: object) => string
  code?: (cxt: KeywordContext) => string | void
  error?: KeywordErrorDefinition
  validateSchema?: ValidateFunction
  implements?: string[]
}

export interface KeywordErrorDefinition {
  message: (cxt: KeywordContext, params?: any) => string
  params: (cxt: KeywordContext, params?: any) => string
}

export type Vocabulary = KeywordDefinition[]

export interface KeywordContext {
  gen: CodeGen
  fail: (condition: string) => void
  ok: (condition?: string) => void
  errorParams: (obj: any) => void
  keyword: string
  data: string
  $data?: string | false
  schema: any
  parentSchema: any
  schemaCode: string | number | boolean
  schemaValue: string | number | boolean
  params?: any
  it: CompilationContext
}

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

export type Format =
  | string
  | RegExp
  | FormatValidator<string>
  | FormatDefinition<any>
  | AsyncFormatDefinition<any>
