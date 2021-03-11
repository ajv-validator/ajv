import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {alwaysValidSchema} from "../../compile/util"
import {validateArray} from "../code"
import {_, not, nil} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullable} from "./nullable"

const def: CodeKeywordDefinition = {
  keyword: "elements",
  schemaType: "object",
  code(cxt: KeywordCxt) {
    checkMetadata(cxt)
    const {gen, data, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const [valid] = checkNullable(cxt, nil)
    gen.if(not(valid), () =>
      gen.if(
        _`Array.isArray(${data})`,
        () => gen.assign(valid, validateArray(cxt)),
        () => cxt.error()
      )
    )
    cxt.ok(valid)
  },
}

export default def
