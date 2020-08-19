import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "anyOf",
  schemaType: "array",
  code(cxt) {
    const {gen, ok, schema, it} = cxt
    let hasEmptySchema = !schema.every((sch: object | boolean) => nonEmptySchema(it, sch))
    if (hasEmptySchema) {
      ok()
      return
    }
    const valid = gen.name("valid")
    const errsCount = gen.name("_errs")
    gen.code(
      `let ${valid} = false;
      const ${errsCount} = errors;`
    )

    let closeBlocks = ""
    schema.forEach((_, i: number) => {
      const schValid = applySubschema(it, {
        keyword: "anyOf",
        schemaProp: i,
        compositeRule: true,
      })
      gen.code(
        `${valid} = ${valid} || ${schValid};
        if (!${valid}) {`
      )
      closeBlocks += "}"
    })

    gen.code(closeBlocks)

    // TODO refactor failCompoundOrReset?
    gen.code(`if (!${valid}) {`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.code(`} else {`)
    resetErrorsCount(gen, errsCount)
    if (it.opts.allErrors) gen.code(`}`)
  },
  error: {
    message: "should match some schema in anyOf",
  },
}

module.exports = def
