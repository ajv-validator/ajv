import type {AnySchemaObject} from "./types"
import AjvCore from "./core"
import draft7Vocabularies from "./vocabularies/draft7"
import discriminator from "./vocabularies/discriminator"
import * as draft7MetaSchema from "./refs/json-schema-draft-07.json"

const META_SUPPORT_DATA = ["/properties"]

const META_SCHEMA_ID = "http://json-schema.org/draft-07/schema"

class Ajv extends AjvCore {
  // compatibility with NodeNext
  static default = Ajv;

  _addVocabularies(): void {
    super._addVocabularies()
    draft7Vocabularies.forEach((v) => this.addVocabulary(v))
    if (this.opts.discriminator) this.addKeyword(discriminator)
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema()
    if (!this.opts.meta) return
    const metaSchema = this.opts.$data
      ? this.$dataMetaSchema(draft7MetaSchema, META_SUPPORT_DATA)
      : draft7MetaSchema
    this.addMetaSchema(metaSchema, META_SCHEMA_ID, false)
    this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID
  }

  defaultMeta(): string | AnySchemaObject | undefined {
    return (this.opts.defaultMeta =
      super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined))
  }
}

export = Ajv
Object.defineProperty(exports, "__esModule", {value: true})

import * as types from "./types"
import * as core from "./core"
import * as compile from "./compile"
import * as compileValidate from "./compile/validate"
import * as vocabulariesErrors from "./vocabularies/errors"
import * as compileRules from "./compile/rules"
import * as typesJsonSchema from "./types/json-schema"
import * as compileCodegen from "./compile/codegen"
import * as runtimeValidationError from "./runtime/validation_error"
import * as compileRefError from "./compile/ref_error"

namespace Ajv {
  export import Format = types.Format;
  export import FormatDefinition = types.FormatDefinition;
  export import AsyncFormatDefinition = types.AsyncFormatDefinition;
  export import KeywordDefinition = types.KeywordDefinition;
  export import KeywordErrorDefinition = types.KeywordErrorDefinition;
  export import CodeKeywordDefinition = types.CodeKeywordDefinition;
  export import MacroKeywordDefinition = types.MacroKeywordDefinition;
  export import FuncKeywordDefinition = types.FuncKeywordDefinition;
  export import Vocabulary = types.Vocabulary;
  export import Schema = types.Schema;
  export import SchemaObject = types.SchemaObject;
  export import AnySchemaObject = types.AnySchemaObject;
  export import AsyncSchema = types.AsyncSchema;
  export import AnySchema = types.AnySchema;
  export import ValidateFunction = types.ValidateFunction;
  export import AsyncValidateFunction = types.AsyncValidateFunction;
  export import SchemaValidateFunction = types.SchemaValidateFunction;
  export import ErrorObject = types.ErrorObject;
  export import ErrorNoParams = types.ErrorNoParams;

  export import Plugin = core.Plugin;
  export import Options = core.Options;
  export import CodeOptions = core.CodeOptions;
  export import InstanceOptions = core.InstanceOptions;
  export import Logger = core.Logger;
  export import ErrorsTextOptions = core.ErrorsTextOptions;

  export import SchemaCxt = compile.SchemaCxt;
  export import SchemaObjCxt = compile.SchemaObjCxt;

  export import KeywordCxt = compileValidate.KeywordCxt;
  export import DefinedError = vocabulariesErrors.DefinedError;
  export import JSONType = compileRules.JSONType;
  export import JSONSchemaType = typesJsonSchema.JSONSchemaType;
  export import _ = compileCodegen._;
  export import str = compileCodegen.str;
  export import stringify = compileCodegen.stringify;
  export import nil = compileCodegen.nil;
  export import Name = compileCodegen.Name;
  export import Code = compileCodegen.Code;
  export import CodeGen = compileCodegen.CodeGen;
  export import CodeGenOptions = compileCodegen.CodeGenOptions;

  export import ValidationError = runtimeValidationError.ValidationError;
  export import MissingRefError = compileRefError.MissingRefError;
}

