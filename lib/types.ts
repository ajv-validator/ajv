import Cache from "./cache"
import CodeGen, {Code, Name, CodeGenOptions} from "./compile/codegen"
import {ValidationRules} from "./compile/rules"
import {ResolvedRef} from "./compile"
import KeywordContext from "./compile/context"

export interface CurrentOptions {
  strict?: boolean | "log"
  $data?: boolean
  allErrors?: boolean
  verbose?: boolean
  format?: false
  formats?: object
  keywords?: Vocabulary | {[x: string]: KeywordDefinition} // map is deprecated
  unknownFormats?: true | string[] | "ignore"
  schemas?: object[] | object
  missingRefs?: true | "ignore" | "fail"
  extendRefs?: true | "ignore" | "fail"
  loadSchema?: (
    uri: string,
    cb?: (err: Error, schema: object) => void
  ) => PromiseLike<object | boolean>
  removeAdditional?: boolean | "all" | "failing"
  useDefaults?: boolean | "empty"
  coerceTypes?: boolean | "array"
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
  codegen?: CodeGenOptions
  cache?: Cache
  logger?: Logger | false
  serialize?: false | ((schema: object | boolean) => any)
  $comment?: true | ((comment: string, schemaPath?: string, rootSchema?: any) => any)
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
  schema: any
  isRoot: boolean
  root: SchemaRoot // TODO ?
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
  resolveRef: (...args: any[]) => ResolvedRef | void
  logger: Logger // TODO ?
  self: any // TODO
}

interface SchemaRoot {
  schema: any
  refVal: (string | undefined)[] // TODO
  refs: {[key: string]: any} // TODO
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
  code: (cxt: KeywordContext, ruleType?: string) => void
  trackErrors?: boolean
}

export type MacroKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
) => object | boolean

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
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
  message: string | ((cxt: KeywordErrorContext) => Code)
  params?: (cxt: KeywordErrorContext) => Code
}

export type Vocabulary = (KeywordDefinition | string)[]

export interface KeywordErrorContext {
  gen: CodeGen
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  parentSchema: any
  schemaCode: Code | number | boolean
  schemaValue: Code | number | boolean
  schemaType?: string | string[]
  errsCount?: Name
  params: KeywordContextParams
  it: CompilationContext
}

export type KeywordContextParams = {[x: string]: Code | string | number}

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
