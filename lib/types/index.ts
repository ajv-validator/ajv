import type {CodeGen, Code, Name, Scope} from "../compile/codegen"
import type {SchemaEnv, SchemaCxt, SchemaObjCxt} from "../compile"
import type {JSONType} from "../compile/rules"
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

interface SourceCode {
  code: string
  scope: Scope
}

interface DataValidationCxt {
  dataPath: string
  parentData: Record<string, any> | any[]
  parentDataProperty: string | number
  rootData: Record<string, any> | any[]
}

export interface ValidateFunction<T = unknown> {
  (this: Ajv | any, data: any, dataCxt?: DataValidationCxt): data is T
  errors?: null | ErrorObject[]
  schema: AnySchema
  schemaEnv: SchemaEnv
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

interface _KeywordDef {
  keyword: string | string[]
  type?: JSONType | JSONType[] // data types that keyword applies to
  schemaType?: JSONType | JSONType[] // allowed type(s) of keyword value in the schema
  allowUndefined?: boolean // used for keywords that can be invoked by other keywords, not being present in the schema
  $data?: boolean // keyword supports [$data reference](../../docs/validation.md#data-reference)
  implements?: string[] // other schema keywords that this keyword implements
  before?: string // keyword should be executed before this keyword (should be applicable to the same type)
  metaSchema?: AnySchemaObject // meta-schema for keyword schema value - it is better to use schemaType where applicable
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
  (schema: any, data: any, parentSchema?: AnySchemaObject, dataCxt?: DataValidationCxt):
    | boolean
    | Promise<any>
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

export type AddedKeywordDefinition = KeywordDefinition & {
  type: JSONType[]
  schemaType: JSONType[]
}

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
  schemaType?: JSONType[]
  errsCount?: Name
  params: KeywordCxtParams
  it: SchemaCxt
}

export interface KeywordCxtParams {
  [x: string]: Code | string | number | undefined
}

export type FormatValidator<T extends string | number> = (data: T) => boolean

export type FormatCompare<T extends string | number> = (data1: T, data2: T) => number | undefined

export type AsyncFormatValidator<T extends string | number> = (data: T) => Promise<boolean>

export interface FormatDefinition<T extends string | number> {
  type?: T extends string ? "string" | undefined : "number"
  validate: FormatValidator<T> | (T extends string ? string | RegExp : never)
  async?: false | undefined
  compare?: FormatCompare<T>
}

export interface AsyncFormatDefinition<T extends string | number> {
  type?: T extends string ? "string" | undefined : "number"
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
