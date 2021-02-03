import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, or, not, Code} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  code(cxt: KeywordCxt) {
    const {gen, data, schema, schemaValue, parentSchema, it} = cxt
    if (schema.length === 0) throw new Error("enum must have non-empty array")
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
  metaSchema: {
    elements: {type: "string"},
  },
}

export default def
