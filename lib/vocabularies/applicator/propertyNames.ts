import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema, loopPropertiesCode} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError} from "../../compile/errors"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "propertyNames",
  type: "object",
  schemaType: ["object", "boolean"],
  code(cxt: KeywordContext) {
    const {gen, schema, it} = cxt
    if (alwaysValidSchema(it, schema)) return
    const valid = gen.name("valid")

    loopPropertiesCode(cxt, (key) => {
      cxt.errorParams({propertyName: key})
      applySubschema(
        it,
        {keyword: "propertyNames", data: key, propertyName: key, compositeRule: true},
        valid
      )
      gen.if(`!${valid}`, () => {
        reportExtraError(cxt, def.error as KeywordErrorDefinition)
        if (!it.allErrors) gen.break()
      })
    })

    cxt.ok(valid)
  },
  error: {
    message: ({params}) => str`property name '${params.propertyName}' is invalid`, // TODO double quotes?
    params: ({params}) => _`{propertyName: ${params.propertyName}}`,
  },
}

module.exports = def
