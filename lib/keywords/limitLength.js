const {concatSchema, dataNotType} = require("../compile/util")

const SCHEMA_TYPE = "number"

module.exports = {
  keywords: ["maxLength", "minLength"],
  type: "string",
  schemaType: SCHEMA_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode, opts}) {
    const op = keyword == "maxLength" ? ">" : "<"
    const dnt = dataNotType($data, schemaCode, SCHEMA_TYPE)
    const len =
      opts.unicode === false ? `${data}.length` : `ucs2length(${data})`
    fail(dnt + len + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxLength" ? "more" : "fewer"
      const sch = concatSchema($data, schemaCode)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}
