import * as types from "./types"
import * as typesJtdSchema from "./types/jtd-schema"
import AjvCore, {CurrentOptions} from "./core"
import jtdVocabulary from "./vocabularies/jtd"
import jtdMetaSchema from "./refs/jtd-schema"
import compileSerializer from "./compile/jtd/serialize"
import compileParser from "./compile/jtd/parse"
import {SchemaEnv} from "./compile"

const META_SCHEMA_ID = "JTD-meta-schema"

class Ajv extends AjvCore {
  constructor(opts: Ajv.JTDOptions = {}) {
    super({
      ...opts,
      jtd: true,
    })
  }

  _addVocabularies(): void {
    super._addVocabularies()
    this.addVocabulary(jtdVocabulary)
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema()
    if (!this.opts.meta) return
    this.addMetaSchema(jtdMetaSchema, META_SCHEMA_ID, false)
  }

  defaultMeta(): string | types.AnySchemaObject | undefined {
    return (this.opts.defaultMeta =
      super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined))
  }

  compileSerializer<T = unknown>(schema: types.SchemaObject): (data: T) => string
  // Separated for type inference to work
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  compileSerializer<T = unknown>(schema: typesJtdSchema.JTDSchemaType<T>): (data: T) => string
  compileSerializer<T = unknown>(schema: types.SchemaObject): (data: T) => string {
    const sch = this._addSchema(schema)
    return sch.serialize || this._compileSerializer(sch)
  }

  compileParser<T = unknown>(schema: types.SchemaObject): types.JTDParser<T>
  // Separated for type inference to work
  // eslint-disable-next-line @typescript-eslint/unified-signatures
  compileParser<T = unknown>(schema: typesJtdSchema.JTDSchemaType<T>): types.JTDParser<T>
  compileParser<T = unknown>(schema: types.SchemaObject): types.JTDParser<T> {
    const sch = this._addSchema(schema)
    return (sch.parse || this._compileParser(sch)) as types.JTDParser<T>
  }

  private _compileSerializer<T>(sch: SchemaEnv): (data: T) => string {
    compileSerializer.call(this, sch, (sch.schema as types.AnySchemaObject).definitions || {})
    /* istanbul ignore if */
    if (!sch.serialize) throw new Error("ajv implementation error")
    return sch.serialize
  }

  private _compileParser(sch: SchemaEnv): types.JTDParser {
    compileParser.call(this, sch, (sch.schema as types.AnySchemaObject).definitions || {})
    /* istanbul ignore if */
    if (!sch.parse) throw new Error("ajv implementation error")
    return sch.parse
  }
}

export = Ajv
Object.defineProperty(Ajv, "__esModule", {value: true})
Object.defineProperty(Ajv, "default", {value: Ajv})

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
declare namespace Ajv {
  // compatibility with NodeNext
  export {Ajv as default}
}

import * as core from "./core"
import * as compile from "./compile"
import * as compileValidate from "./compile/validate"
import * as vocabulariesJtd from "./vocabularies/jtd"
import * as compileCodegen from "./compile/codegen"
import * as runtimeValidationError from "./runtime/validation_error"
import * as compileRefError from "./compile/ref_error"

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
namespace Ajv {
  /* eslint-disable @typescript-eslint/no-unused-vars */
  export import Format = types.Format
  export import FormatDefinition = types.FormatDefinition
  export import AsyncFormatDefinition = types.AsyncFormatDefinition
  export import KeywordDefinition = types.KeywordDefinition
  export import KeywordErrorDefinition = types.KeywordErrorDefinition
  export import CodeKeywordDefinition = types.CodeKeywordDefinition
  export import MacroKeywordDefinition = types.MacroKeywordDefinition
  export import FuncKeywordDefinition = types.FuncKeywordDefinition
  export import Vocabulary = types.Vocabulary
  export import Schema = types.Schema
  export import SchemaObject = types.SchemaObject
  export import AnySchemaObject = types.AnySchemaObject
  export import AsyncSchema = types.AsyncSchema
  export import AnySchema = types.AnySchema
  export import ValidateFunction = types.ValidateFunction
  export import AsyncValidateFunction = types.AsyncValidateFunction
  export import ErrorObject = types.ErrorObject
  export import ErrorNoParams = types.ErrorNoParams
  export import JTDParser = types.JTDParser

  export import Plugin = core.Plugin
  export import Options = core.Options
  export import CodeOptions = core.CodeOptions
  export import InstanceOptions = core.InstanceOptions
  export import Logger = core.Logger
  export import ErrorsTextOptions = core.ErrorsTextOptions

  export import SchemaCxt = compile.SchemaCxt
  export import SchemaObjCxt = compile.SchemaObjCxt

  export import KeywordCxt = compileValidate.KeywordCxt
  export import JTDErrorObject = vocabulariesJtd.JTDErrorObject
  export import _ = compileCodegen._
  export import str = compileCodegen.str
  export import stringify = compileCodegen.stringify
  export import nil = compileCodegen.nil
  export import Name = compileCodegen.Name
  export import Code = compileCodegen.Code
  export import CodeGen = compileCodegen.CodeGen
  export import CodeGenOptions = compileCodegen.CodeGenOptions

  export import SomeJTDSchemaType = typesJtdSchema.SomeJTDSchemaType
  export import JTDDataType = typesJtdSchema.JTDDataType
  export import JTDSchemaType = typesJtdSchema.JTDSchemaType
  export import ValidationError = runtimeValidationError.ValidationError
  export import MissingRefError = compileRefError.MissingRefError

  export type JTDOptions = CurrentOptions & {
    // strict mode options not supported with JTD:
    strict?: never
    allowMatchingProperties?: never
    allowUnionTypes?: never
    validateFormats?: never
    // validation and reporting options not supported with JTD:
    $data?: never
    verbose?: boolean
    $comment?: never
    formats?: never
    loadSchema?: never
    // options to modify validated data:
    useDefaults?: never
    coerceTypes?: never
    // advanced options:
    next?: never
    unevaluated?: never
    dynamicRef?: never
    meta?: boolean
    defaultMeta?: never
    inlineRefs?: boolean
    loopRequired?: never
    multipleOfPrecision?: never
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
