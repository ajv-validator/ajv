import type {CodeKeywordDefinition, KeywordErrorDefinition, ErrorObject} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, str, not, getProperty, Name} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullableObject} from "./nullable"
import {typeErrorMessage, typeErrorParams, _JTDTypeError} from "./error"

enum DiscrError {
  NoTag,
  TagType,
  NoMapping,
}

type DiscrErrorObj<E extends DiscrError, T = any> = ErrorObject<
  "discriminator",
  {error: E; tag: string; tagValue: T},
  string
>

export type JTDDiscriminatorError =
  | _JTDTypeError<"discriminator", "object", string>
  | DiscrErrorObj<DiscrError.NoTag, never>
  | DiscrErrorObj<DiscrError.TagType>
  | DiscrErrorObj<DiscrError.NoMapping>

export const error: KeywordErrorDefinition = {
  message: (cxt) => {
    const {schema, params} = cxt
    switch (params.discrError) {
      case DiscrError.NoTag:
        return str`tag "${schema}" is missing`
      case DiscrError.TagType:
        return str`value of tag "${schema}" must be string`
      case DiscrError.NoMapping:
        return "tag value must be in schema mapping"
      default:
        return typeErrorMessage(cxt, "object")
    }
  },
  params: (cxt) => {
    const {schema, params} = cxt
    const err = _`{error: ${params.discrError}, tag: ${schema}`
    switch (params.discrError) {
      case DiscrError.NoTag:
        return _`${err}}`
      case DiscrError.TagType:
      case DiscrError.NoMapping:
        return _`${err}, tagValue: ${params.tag}}`
      default:
        return typeErrorParams(cxt, "object")
    }
  },
}

const def: CodeKeywordDefinition = {
  keyword: "discriminator",
  schemaType: "string",
  implements: ["mapping"],
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, parentSchema} = cxt
    const [valid, cond] = checkNullableObject(cxt, data)

    gen.if(cond)
    validateDiscriminator()
    gen.elseIf(not(valid))
    cxt.error()
    gen.endIf()
    cxt.ok(valid)

    function validateDiscriminator(): void {
      const tag = gen.const("tag", _`${data}${getProperty(schema)}`)
      gen.if(_`${tag} === undefined`)
      cxt.error(false, {discrError: DiscrError.NoTag})
      gen.elseIf(_`typeof ${tag} == "string"`)
      validateMapping(tag)
      gen.else()
      cxt.error(false, {discrError: DiscrError.TagType, tag}, {instancePath: schema})
      gen.endIf()
    }

    function validateMapping(tag: Name): void {
      gen.if(false)
      for (const tagValue in parentSchema.mapping) {
        gen.elseIf(_`${tag} === ${tagValue}`)
        gen.assign(valid, applyTagSchema(tagValue))
      }
      gen.else()
      cxt.error(
        false,
        {discrError: DiscrError.NoMapping, tag},
        {instancePath: schema, schemaPath: "mapping", parentSchema: true}
      )
      gen.endIf()
    }

    function applyTagSchema(schemaProp: string): Name {
      const _valid = gen.name("valid")
      cxt.subschema(
        {
          keyword: "mapping",
          schemaProp,
          jtdDiscriminator: schema,
        },
        _valid
      )
      return _valid
    }
  },
}

export default def
