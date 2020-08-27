import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {dataNotType} from "../util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: ["maxItems", "minItems"],
  type: "array",
  schemaType: "number",
  $data: true,
  code(cxt: KeywordContext) {
    const {keyword, data, $data, schemaCode} = cxt
    const op = keyword === "maxItems" ? ">" : "<"
    const dnt = dataNotType(schemaCode, <string>def.schemaType, $data)
    cxt.fail(dnt + `${data}.length` + op + schemaCode)
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
