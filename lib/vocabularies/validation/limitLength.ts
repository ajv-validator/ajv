import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {_, str, operators} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxLength", "minLength"],
  type: "string",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordCtx) {
    const {keyword, data, schemaCode, it} = cxt
    const op = keyword === "maxLength" ? operators.GT : operators.LT
    const len = it.opts.unicode === false ? _`${data}.length` : _`ucs2length(${data})`
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
