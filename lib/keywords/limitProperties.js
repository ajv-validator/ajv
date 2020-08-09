const {concatSchema, dataNotType} = require("../compile/util")

const SCHEMA_TYPE = "number"

module.exports = {
  keywords: ["maxProperties", "minProperties"],
  type: "object",
  schemaType: SCHEMA_TYPE,
  $data: true,
  code({fail, keyword, data, $data, schemaCode}) {
    const op = keyword == "maxProperties" ? ">" : "<"
    const dnt = dataNotType($data, schemaCode, SCHEMA_TYPE)
    fail(dnt + `Object.keys(${data}).length` + op + schemaCode)
  },
  error: {
    message({keyword, $data, schemaCode}) {
      const comp = keyword == "maxProperties" ? "more" : "fewer"
      const sch = concatSchema($data, schemaCode)
      return `"should NOT have ${comp} than ${sch} items"`
    },
    params: ({schemaCode}) => `{limit: ${schemaCode}}`,
  },
}
