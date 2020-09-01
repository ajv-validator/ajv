import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {_, str, operators} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordContext) {
    const {keyword, data, schemaCode} = cxt
    const op = keyword === "maxItems" ? operators.GT : operators.LT
    cxt.fail$data(_`${data}.length ${op} ${schemaCode}`)
  },
  error: {
    message({keyword, schemaCode}) {
      const comp = keyword === "maxItems" ? "more" : "fewer"
      return str`should NOT have ${comp} than ${schemaCode} items`
    },
    params: ({schemaCode}) => _`{limit: ${schemaCode}}`,
  },
}

module.exports = def
