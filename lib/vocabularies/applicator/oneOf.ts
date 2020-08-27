import {CodeKeywordDefinition, KeywordErrorDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"
import {_} from "../../compile/codegen"
import N from "../../compile/names"

const def: CodeKeywordDefinition = {
  keyword: "oneOf",
  schemaType: "array",
  code(cxt: KeywordContext) {
    const {gen, schema, it} = cxt
    const valid = gen.let("valid", false)
    const errsCount = gen.const("_errs", N.errors)
    const passing = gen.let("passing", "null")
    const schValid = gen.name("_valid")
    cxt.errorParams({passing})
    // TODO possibly fail straight away (with warning or exception) if there are two empty always valid schemas

    gen.block(validateOneOf)

    // TODO refactor failCompoundOrReset?
    // TODO refactor ifs
    gen.if(_`!${valid}`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    gen.else()
    resetErrorsCount(gen, errsCount)
    if (it.allErrors) gen.endIf()

    function validateOneOf() {
      schema.forEach((sch, i: number) => {
        if (alwaysValidSchema(it, sch)) {
          gen.var(schValid, true)
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
            .if(_`${schValid} && ${valid}`)
            .code(
              _`${valid} = false;
                ${passing} = [${passing}, ${i}];`
            )
            .else()
        }

        gen.if(schValid, _`${valid} = true; ${passing} = ${i};`)
      })
    }
  },
  error: {
    message: "should match exactly one schema in oneOf",
    params: ({params}) => _`{passingSchemas: ${params.passing}}`,
  },
}

module.exports = def
