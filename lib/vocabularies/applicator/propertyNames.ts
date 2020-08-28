import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema, loopPropertiesCode} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError} from "../../compile/errors"
import {_, str} from "../../compile/codegen"

const error: KeywordErrorDefinition = {
  message: ({params}) => str`property name '${params.propertyName}' is invalid`, // TODO double quotes?
  params: ({params}) => _`{propertyName: ${params.propertyName}}`,
}

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
      gen.ifNot(valid, () => {
        reportExtraError(cxt, error)
        if (!it.allErrors) gen.break()
      })
    })

    cxt.ok(valid)
  },
}

module.exports = def
