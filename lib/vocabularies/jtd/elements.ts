import type {CodeKeywordDefinition} from "../../types"
import {validateArray} from "../code"
import {_, not, and, Code} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "elements",
  schemaType: "object",
  code(cxt) {
    const {gen, data, parentSchema} = cxt
    const valid = gen.name("valid")
    let cond: Code = _`Array.isArray(${data})`
    if (parentSchema.nullable) {
      gen.let(valid, _`${data} === null`)
      cond = and(not(valid), cond)
    } else {
      gen.let(valid)
    }
    gen.if(cond, () =>
      gen
        .assign(valid, _`${data}.length === 0`)
        .if(not(valid), () => gen.assign(valid, validateArray(cxt)))
    )
    cxt.pass(valid)
  },
}

export default def
