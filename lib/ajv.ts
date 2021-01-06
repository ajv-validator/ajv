export {
  Format,
  FormatDefinition,
  AsyncFormatDefinition,
  KeywordDefinition,
  KeywordErrorDefinition,
  CodeKeywordDefinition,
  MacroKeywordDefinition,
  FuncKeywordDefinition,
  Vocabulary,
  Schema,
  SchemaObject,
  AnySchemaObject,
  AsyncSchema,
  AnySchema,
  ValidateFunction,
  AsyncValidateFunction,
  ErrorObject,
  ErrorNoParams,
} from "./types"

export {Plugin, Options, CodeOptions, InstanceOptions, Logger, ErrorsTextOptions} from "./core"
export {SchemaCxt, SchemaObjCxt} from "./compile"
import KeywordCxt from "./compile/context"
export {KeywordCxt}
export {DefinedError} from "./vocabularies/errors"
export {JSONType} from "./compile/rules"
export {JSONSchemaType} from "./types/json-schema"
export {_, str, stringify, nil, Name, Code, CodeGen, CodeGenOptions} from "./compile/codegen"

import type {AnySchemaObject} from "./types"
import AjvCore, { Options } from "./core"
import draft7Vocabularies from "./vocabularies/draft7"
import draft7MetaSchema = require("./refs/json-schema-draft-07.json")

const META_SUPPORT_DATA = ["/properties"]

const META_SCHEMA_ID = "http://json-schema.org/draft-07/schema"

export default class Ajv extends AjvCore {
  constructor(opts: Options = {}) {
    super(opts)
  }
  _addVocabularies(): void {
    super._addVocabularies()
    draft7Vocabularies.forEach((v) => this.addVocabulary(v))
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema()
    const {$data, meta} = this.opts
    if (!meta) return
    const metaSchema = $data
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
