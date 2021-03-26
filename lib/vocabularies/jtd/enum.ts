import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, or, not, Code} from "../../compile/codegen"
import {checkMetadata} from "./metadata"

const def: CodeKeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, schemaValue, parentSchema, it} = cxt
    if (schema.length === 0) throw new Error("enum must have non-empty array")
    if (schema.length !== new Set(schema).size) throw new Error("enum items must be unique")
    let valid: Code
    if (schema.length >= it.opts.loopEnum) {
      if (parentSchema.nullable) {
        valid = gen.let("valid", _`${data} === null`)
        gen.if(not(valid), loopEnum)
      } else {
        valid = gen.let("valid", false)
        loopEnum()
      }
    } else {
      /* istanbul ignore if */
      if (!Array.isArray(schema)) throw new Error("ajv implementation error")
      valid = or(...schema.map((value: string) => _`${data} === ${value}`))
      if (parentSchema.nullable) valid = or(_`${data} === null`, valid)
    }
    cxt.pass(valid)

    function loopEnum(): void {
      gen.forOf("v", schemaValue as Code, (v) =>
        gen.if(_`${valid} = ${data} === ${v}`, () => gen.break())
      )
    }
  },
}

export default def
