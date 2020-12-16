import type {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, str, operators} from "../../compile/codegen"
import ucs2length from "../../compile/ucs2length"

const error: KeywordErrorDefinition = {
  message({keyword, schemaCode}) {
    const comp = keyword === "maxLength" ? "more" : "fewer"
    return str`should NOT have ${comp} than ${schemaCode} characters`
  },
  params: ({schemaCode}) => _`{limit: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {keyword, data, schemaCode, it} = cxt
    const op = keyword === "maxLength" ? operators.GT : operators.LT
    let len
    if (it.opts.unicode === false) {
      len = _`${data}.length`
    } else {
      const u2l = cxt.gen.scopeValue("func", {
        ref: ucs2length,
        code: _`require("ajv/dist/compile/ucs2length").default`,
      })
      len = _`${u2l}(${data})`
    }
    cxt.fail$data(_`${len} ${op} ${schemaCode}`)
  },
}

export default def
