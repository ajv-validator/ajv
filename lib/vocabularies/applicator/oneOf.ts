import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {nonEmptySchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: KeywordDefinition = {
  keyword: "oneOf",
  schemaType: "array",
  code(cxt) {
    const {gen, errorParams, schema, it} = cxt
    const valid = gen.name("valid")
    const schValid = gen.name("_valid")
    const errsCount = gen.name("_errs")
    const passing = gen.name("passing")
    errorParams({passing})
    gen
      .code(
        `const ${errsCount} = errors;
        let ${valid} = false;
        let ${passing} = null;`
      )
      .startBlock()

    // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas

    schema.forEach((sch, i: number) => {
      if (nonEmptySchema(it, sch)) {
        applySubschema(
          it,
          {
            keyword: "oneOf",
            schemaProp: i,
            compositeRule: true,
          },
          schValid
        )
      } else {
        gen.code(`var ${schValid} = true;`)
      }

      if (i > 0) {
        gen
          .if(`${schValid} && ${valid}`)
          .code(
            `${valid} = false;
            ${passing} = [${passing}, ${i}];`
          )
          .else()
      }

      gen.code(
        `if (${schValid}) {
          ${valid} = true;
          ${passing} = ${i};
        }`
      )
    })

    gen.endBlock()

    // TODO refactor failCompoundOrReset?
    // TODO refactor ifs
    gen.code(`if (!${valid}) {`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.code(`} else {`)
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.code(`}`)
  },
  error: {
    message: "should match exactly one schema in oneOf",
    params: ({params}) => `{passingSchemas: ${params.passing}}`,
  },
}

module.exports = def
