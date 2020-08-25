import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: CodeKeywordDefinition = {
  keyword: "oneOf",
  schemaType: "array",
  code(cxt) {
    const {gen, errorParams, schema, it} = cxt
    const valid = gen.name("valid")
    const schValid = gen.name("_valid")
    const errsCount = gen.name("_errs")
    const passing = gen.name("passing")
    errorParams({passing})
    // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas

    gen
      .code(
        `const ${errsCount} = errors;
        let ${valid} = false;
        let ${passing} = null;`
      )
      .block(validateOneOf)

    // TODO refactor failCompoundOrReset?
    // TODO refactor ifs
    gen.if(`!${valid}`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.else()
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.endIf()

    function validateOneOf() {
      schema.forEach((sch, i: number) => {
        if (alwaysValidSchema(it, sch)) {
          gen.code(`var ${schValid} = true;`)
        } else {
          applySubschema(
            it,
            {
              keyword: "oneOf",
              schemaProp: i,
              compositeRule: true,
            },
            schValid
          )
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

        gen.if(schValid, `${valid} = true; ${passing} = ${i};`)
      })
    }
  },
  error: {
    message: "should match exactly one schema in oneOf",
    params: ({params}) => `{passingSchemas: ${params.passing}}`,
  },
}

module.exports = def
