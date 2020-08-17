import {KeywordDefinition} from "../../types"

const def: KeywordDefinition = {
  keyword: "const",
  $data: true,
  code: ({fail, data, schemaCode}) => fail(`!equal(${data}, ${schemaCode})`),
  error: {
    // TODO allow message to be just a string if it is constant?
    message: () => '"should be equal to constant"',
    params: ({schemaCode}) => `{allowedValue: ${schemaCode}}`,
  },
}

module.exports = def
