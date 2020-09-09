import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {_, str, operators} from "../../compile/codegen"
import ucs2length from "../../compile/ucs2length"

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordCtx) {
    const {keyword, data, schemaCode, it} = cxt
    const op = keyword === "maxLength" ? operators.GT : operators.LT
    let len
    if (it.opts.unicode === false) {
      len = _`${data}.length`
    } else {
      const u2l = cxt.gen.scopeValue("func", {
        ref: ucs2length,
        code: _`require("ajv/dist/compile/ucs2length")`,
      })
      len = _`${u2l}(${data})`
    }
    cxt.fail$data(_`${len} ${op} ${schemaCode}`)
  },
  error: {
    message({keyword, schemaCode}) {
      const comp = keyword === "maxLength" ? "more" : "fewer"
      return str`should NOT have ${comp} than ${schemaCode} items`
    },
    params: ({schemaCode}) => _`{limit: ${schemaCode}}`,
  },
}

module.exports = def
