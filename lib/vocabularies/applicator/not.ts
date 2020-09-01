import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"

const def: CodeKeywordDefinition = {
  keyword: "not",
  schemaType: ["object", "boolean"],
  trackErrors: true,
  code(cxt: KeywordContext) {
    const {gen, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) {
      cxt.fail()
      return
    }

    const valid = gen.name("valid")
    applySubschema(
      it,
      {
        keyword: "not",
        compositeRule: true,
        createErrors: false,
        allErrors: false,
      },
      valid
    )

    cxt.result(
      valid,
      () => cxt.error(),
      () => cxt.reset()
    )
  },
  error: {
    message: "should NOT be valid",
  },
}

module.exports = def
