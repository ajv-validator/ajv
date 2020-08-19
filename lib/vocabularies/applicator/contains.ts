import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema, Expr} from "../../compile/subschema"
import {reportError, resetErrorsCount} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "contains",
  type: "array",
  schemaType: ["object", "boolean"],
  code(cxt) {
    const {gen, fail, schema, data, it} = cxt
    const errsCount = gen.name("_errs")
    gen.code(`const ${errsCount} = errors;`)

    if (nonEmptySchema(it, schema)) {
      const i = gen.name("i")
      gen.code(`for (let ${i}=0; ${i}<${data}.length; ${i}++) {`)
      const schValid = applySubschema(it, {
        keyword: "contains",
        dataProp: i,
        expr: Expr.Num,
        compositeRule: true,
      })
      gen.code(
        `if (${schValid}) break;
        }`
      )

      // TODO refactor failCompoundOrReset? It is different from anyOf though
      gen.code(`if (!${schValid}) {`)
      reportError(cxt, def.error as KeywordErrorDefinition)
      gen.code(`} else {`)
      resetErrorsCount(gen, errsCount)
      if (it.opts.allErrors) gen.code(`}`)
    } else {
      fail(`${data}.length === 0`)
    }
  },
  error: {
    message: () => '"should contain a valid item"',
    params: () => "{}",
  },
}

module.exports = def
