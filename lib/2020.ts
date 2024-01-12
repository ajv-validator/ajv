import * as types from "./types"
import * as core from "./core"

import draft2020Vocabularies from "./vocabularies/draft2020"
import discriminator from "./vocabularies/discriminator"
import addMetaSchema2020 from "./refs/json-schema-2020-12"

const META_SCHEMA_ID = "https://json-schema.org/draft/2020-12/schema"

class Ajv2020 extends core.Ajv {
  constructor(opts: core.Options = {}) {
    super({
      ...opts,
      dynamicRef: true,
      next: true,
      unevaluated: true,
    })
  }

  _addVocabularies(): void {
    super._addVocabularies()
    draft2020Vocabularies.forEach((v) => this.addVocabulary(v))
    if (this.opts.discriminator) this.addKeyword(discriminator)
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema()
    const {$data, meta} = this.opts
    if (!meta) return
    addMetaSchema2020.call(this, $data)
    this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID
  }

  defaultMeta(): string | types.AnySchemaObject | undefined {
    return (this.opts.defaultMeta =
      super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined))
  }
}

export = Ajv2020
Object.defineProperty(Ajv2020, "__esModule", {value: true})
Object.defineProperty(Ajv2020, "default", {value: Ajv2020})

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
declare namespace Ajv2020 {
  // compatibility with NodeNext
  export {Ajv2020 as default}
}

import * as compile from "./compile"
import * as compileValidate from "./compile/validate"
import * as vocabulariesErrors from "./vocabularies/errors"
import * as compileRules from "./compile/rules"
import * as typesJsonSchema from "./types/json-schema"
import * as compileCodegen from "./compile/codegen"
import * as runtimeValidationError from "./runtime/validation_error"
import * as compileRefError from "./compile/ref_error"

// eslint-disable-next-line @typescript-eslint/no-namespace, no-redeclare
namespace Ajv2020 {
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

  export import Plugin = core.Plugin
  export import Options = core.Options
  export import CodeOptions = core.CodeOptions
  export import InstanceOptions = core.InstanceOptions
  export import Logger = core.Logger
  export import ErrorsTextOptions = core.ErrorsTextOptions

  export import SchemaCxt = compile.SchemaCxt
  export import SchemaObjCxt = compile.SchemaObjCxt

  export import KeywordCxt = compileValidate.KeywordCxt
  export import DefinedError = vocabulariesErrors.DefinedError

  export import JSONType = compileRules.JSONType
  export import JSONSchemaType = typesJsonSchema.JSONSchemaType
  export import _ = compileCodegen._
  export import str = compileCodegen.str
  export import stringify = compileCodegen.stringify
  export import nil = compileCodegen.nil
  export import Name = compileCodegen.Name
  export import Code = compileCodegen.Code
  export import CodeGen = compileCodegen.CodeGen
  export import CodeGenOptions = compileCodegen.CodeGenOptions

  export import ValidationError = runtimeValidationError.ValidationError
  export import MissingRefError = compileRefError.MissingRefError
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
