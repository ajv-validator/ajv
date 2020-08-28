import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "const",
  $data: true,
  code: (cxt: KeywordContext) => cxt.fail(`!equal(${cxt.data}, ${cxt.schemaCode})`),
  error: {
    message: "should be equal to constant",
    params: ({schemaCode}) => _`{allowedValue: ${schemaCode}}`,
  },
}

module.exports = def
