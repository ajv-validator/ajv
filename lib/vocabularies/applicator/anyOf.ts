import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"
import {_} from "../../compile/codegen"
import N from "../../compile/names"

const error: KeywordErrorDefinition = {
  message: "should match some schema in anyOf",
}

const def: CodeKeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  error,
  code(cxt: KeywordContext) {
    const {gen, schema, it} = cxt
    const alwaysValid = schema.some((sch: object | boolean) => alwaysValidSchema(it, sch))
    if (alwaysValid) return

    const errsCount = gen.const("_errs", N.errors)
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
        gen.ifNot(valid)
      })
    }, schema.length)

    cxt.result(
      valid,
      () => resetErrorsCount(gen, errsCount),
      () => reportExtraError(cxt, error)
    )
  },
}

module.exports = def
