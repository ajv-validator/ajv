import {CodeKeywordDefinition, KeywordErrorDefinition, CompilationContext} from "../../types"
import {alwaysValidSchema} from "../util"
import {applySubschema} from "../../compile/subschema"
import {reportExtraError, resetErrorsCount} from "../../compile/errors"

const def: CodeKeywordDefinition = {
  keyword: "if",
  schemaType: ["object", "boolean"],
  // TODO
  // implements: ["then", "else"],
  code(cxt) {
    const {gen, ok, errorParams, it} = cxt
    const hasThen = hasSchema(it, "then")
    const hasElse = hasSchema(it, "else")
    if (!hasThen && !hasElse) {
      // TODO strict mode: fail or warning if both "then" and "else" are not present
      ok()
      return
    }

    const valid = gen.name("valid")
    const schValid = gen.name("_valid")
    const errsCount = gen.name("_errs")

    gen.code(
      `const ${errsCount} = errors;
      let ${valid} = true;`
    )

    validateIf()
    resetErrorsCount(gen, errsCount)

    if (hasThen && hasElse) {
      const ifClause = gen.name("ifClause")
      errorParams({ifClause})
      gen.code(`let ${ifClause};`)
      gen.if(schValid, validateClause("then", ifClause), validateClause("else", ifClause))
    } else if (hasThen) {
      gen.if(schValid, validateClause("then"))
    } else {
      gen.if(`!${schValid}`, validateClause("else"))
    }

    // // TODO refactor failCompoundOrReset?
    // // TODO refactor ifs
    gen.if(`!${valid}`)
    reportExtraError(cxt, def.error as KeywordErrorDefinition)
    if (it.allErrors) gen.endIf()
    else gen.else()

    function validateIf(): void {
      applySubschema(
        it,
        {
          keyword: "if",
          compositeRule: true,
          createErrors: false,
          allErrors: false,
        },
        schValid
      )
    }

    function validateClause(keyword: string, ifClause?: string): () => void {
      return () => {
        applySubschema(it, {keyword}, schValid)
        gen.code(`${valid} = ${schValid};`)
        if (ifClause) gen.code(`${ifClause} = "${keyword}";`)
        else errorParams({ifClause: `"${keyword}"`})
      }
    }
  },
  error: {
    message: ({params}) => `'should match "' + ${params.ifClause} + '" schema'`,
    params: ({params}) => `{failingKeyword: ${params.ifClause}}`,
  },
}

module.exports = def

function hasSchema(it: CompilationContext, keyword: string): boolean {
  const schema = it.schema[keyword]
  return schema !== undefined && !alwaysValidSchema(it, schema)
}
