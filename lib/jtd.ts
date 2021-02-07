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
// export {DefinedError} from "./vocabularies/errors"
export {_, str, stringify, nil, Name, Code, CodeGen, CodeGenOptions} from "./compile/codegen"

import type {AnySchemaObject} from "./types"
import AjvCore, {Options} from "./core"
import jtdVocabulary from "./vocabularies/jtd"
import jtdMetaSchema from "./refs/jtd-schema"

// const META_SUPPORT_DATA = ["/properties"]

const META_SCHEMA_ID = "JTD-meta-schema"

export default class Ajv extends AjvCore {
  constructor(opts: Options = {}) {
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

  defaultMeta(): string | AnySchemaObject | undefined {
    return (this.opts.defaultMeta =
      super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined))
  }
}
