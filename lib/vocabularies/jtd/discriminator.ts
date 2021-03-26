import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, getProperty, Name} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullableObject} from "./nullable"

const def: CodeKeywordDefinition = {
  keyword: "discriminator",
  schemaType: "string",
  implements: ["mapping"],
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, parentSchema} = cxt
    const [valid, cond] = checkNullableObject(cxt, data)

    gen.if(cond, () => {
      const tag = gen.const("tag", _`${data}${getProperty(schema)}`)
      gen.if(_`typeof ${tag} == "string"`, () => {
        gen.if(false)
        for (const tagValue in parentSchema.mapping) {
          gen.elseIf(_`${tag} === ${tagValue}`)
          gen.assign(valid, applyTagSchema(tagValue))
        }
        gen.endIf()
      })
    })
    cxt.pass(valid)

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
