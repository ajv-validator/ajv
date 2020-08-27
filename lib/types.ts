import Cache from "./cache"
import CodeGen, {Name, Expression} from "./compile/codegen"
import {ValidationRules} from "./compile/rules"
import {ResolvedRef} from "./compile"
import KeywordContext from "./compile/context"

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
  gen: CodeGen
  allErrors: boolean
  dataLevel: number
  data: Name
  parentData: Name
  parentDataProperty: Expression | number
  dataNames: Name[]
  dataPathArr: (Expression | number)[]
  schema: any
  isRoot: boolean
  schemaPath: string
  errorPath: string
  errSchemaPath: string
  propertyName?: Name
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
  usePattern: (str: string) => string
  useDefault: (value: any) => string
  customRules: KeywordCompilationResult[]
  self: any // TODO
  RULES: ValidationRules
  logger: Logger // TODO ?
  root: SchemaRoot // TODO ?
  rootId: string // TODO ?
  topSchemaRef: Expression // TODO must be Code - depends on global names
  resolveRef: (...args: any[]) => ResolvedRef | void
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
  implements?: string[]
  before?: string
  metaSchema?: object
  validateSchema?: ValidateFunction // compiled keyword metaSchema - should not be passed
  dependencies?: string[] // keywords that must be present in the same schema
  error?: KeywordErrorDefinition // TODO all keyword types should support error
}

export interface CodeKeywordDefinition extends _KeywordDef {
  code: (cxt: KeywordContext, ruleType?: string) => void
  $data?: boolean
}

export type MacroKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
) => object | boolean

export type FuncKeywordDefinition = CompiledKeywordDefinition | ValidatedKeywordDefinition

export type CompileKeywordFunc = (
  schema: any,
  parentSchema: object,
  it: CompilationContext
) => ValidateFunction

interface $DataKeywordDef extends _KeywordDef {
  validate?: SchemaValidateFunction | ValidateFunction
  $data?: boolean // requires "validate"
  // schema: false makes validate not to expect schema (ValidateFunction)
  schema?: boolean // requires "validate"
  modifying?: boolean
  async?: boolean
  valid?: boolean
  errors?: boolean | "full"
}

export interface MacroKeywordDefinition extends $DataKeywordDef {
  macro: MacroKeywordFunc
}

export interface CompiledKeywordDefinition extends $DataKeywordDef {
  compile: CompileKeywordFunc
}

export interface ValidatedKeywordDefinition extends $DataKeywordDef {
  validate: SchemaValidateFunction | ValidateFunction
}

export type KeywordDefinition =
  | MacroKeywordDefinition
  | CompiledKeywordDefinition
  | ValidatedKeywordDefinition
  | CodeKeywordDefinition

export interface KeywordErrorDefinition {
  message: string | ((cxt: KeywordErrorContext) => Expression)
  params?: (cxt: KeywordErrorContext) => Expression
}

export type Vocabulary = KeywordDefinition[]

export interface KeywordErrorContext {
  gen: CodeGen
  keyword: string
  data: Name
  $data?: string | false
  schema: any
  parentSchema: any
  schemaCode: Expression | number | boolean
  schemaValue: Expression | number | boolean
  params: KeywordContextParams
  it: CompilationContext
}

// export interface KeywordContext extends KeywordErrorContext {
//   ok: (condition: Expression) => void
//   pass: (condition: Expression, failAction?: () => void, context?: KeywordContext) => void
//   fail: (condition?: Expression, failAction?: () => void, context?: KeywordContext) => void
//   errorParams: (obj: KeywordContextParams, assing?: true) => void
// }

export type KeywordContextParams = {[x: string]: Expression | number}

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
