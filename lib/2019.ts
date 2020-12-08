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
import AjvCore, {Options} from "./core"

import draft7Vocabularies from "./vocabularies/draft7"
import dynamicVocabulary from "./vocabularies/dynamic"
import nextVocabulary from "./vocabularies/next"
import unevaluatedVocabulary from "./vocabularies/unevaluated"
import addMetaSchema2019 from "./refs/json-schema-2019-09"

const META_SCHEMA_ID = "https://json-schema.org/draft/2019-09/schema"

export default class Ajv2019 extends AjvCore {
  constructor(opts: Options = {}) {
    super({
      ...opts,
      dynamicRef: true,
      next: true,
      unevaluated: true,
    })
  }

  _addVocabularies(): void {
    super._addVocabularies()
    this.addVocabulary(dynamicVocabulary)
    draft7Vocabularies.forEach((v) => this.addVocabulary(v))
    this.addVocabulary(nextVocabulary)
    this.addVocabulary(unevaluatedVocabulary)
  }

  _addDefaultMetaSchema(): void {
    super._addDefaultMetaSchema()
    const {$data, meta} = this.opts
    if (!meta) return
    addMetaSchema2019.call(this, $data)
    this.refs["http://json-schema.org/schema"] = META_SCHEMA_ID
  }

  defaultMeta(): string | AnySchemaObject | undefined {
    return (this.opts.defaultMeta =
      super.defaultMeta() || (this.getSchema(META_SCHEMA_ID) ? META_SCHEMA_ID : undefined))
  }
}
