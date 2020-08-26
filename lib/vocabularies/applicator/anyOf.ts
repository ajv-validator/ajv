import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"
import {_} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  code(cxt) {
    const {gen, schema, it} = cxt
    const alwaysValid = schema.some((sch: object | boolean) => alwaysValidSchema(it, sch))
    if (alwaysValid) return

    const errsCount = gen.const("_errs", "errors")
    const valid = gen.let("valid", false)
    const schValid = gen.name("_valid")

    gen.block(() => {
      schema.forEach((_sch, i: number) => {
        applySubschema(
          it,
          {
            keyword: "anyOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
        gen.code(_`${valid} = ${valid} || ${schValid};`)
        gen.if(_`!${valid}`)
      })
    }, schema.length)

    // TODO refactor failCompoundOrReset?
    gen.if(`!${valid}`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.else()
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.endIf()
  },
  error: {
    message: "should match some schema in anyOf",
  },
}

module.exports = def
