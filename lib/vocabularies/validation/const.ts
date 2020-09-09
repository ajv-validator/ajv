import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {_} from "../../compile/codegen"
import equal from "fast-deep-equal"

const def: CodeKeywordDefinition = {
  keyword: "const",
  $data: true,
  code(cxt: KeywordCtx) {
    const eql = cxt.gen.scopeValue("func", {
      ref: equal,
      code: _`require("ajv/dist/compile/equal")`,
    })
    cxt.fail$data(_`!${eql}(${cxt.data}, ${cxt.schemaCode})`)
  },
  error: {
    message: "should be equal to constant",
    params: ({schemaCode}) => _`{allowedValue: ${schemaCode}}`,
  },
}

module.exports = def
