import {CodeKeywordDefinition} from "../../types"

const def: CodeKeywordDefinition = {
  keyword: "const",
  $data: true,
  code: ({fail, data, schemaCode}) => fail(`!equal(${data}, ${schemaCode})`),
  error: {
    message: "should be equal to constant",
    params: ({schemaCode}) => `{allowedValue: ${schemaCode}}`,
  },
}

module.exports = def
