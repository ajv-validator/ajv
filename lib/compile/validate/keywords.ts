import {CompilationContext} from "../../types"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, schemaHasRulesExcept} from "../util"
import {assignDefaults} from "./defaults"
import {reportTypeError} from "./dataType"

export function schemaKeywords(
  it: CompilationContext,
  types: string[],
  typeErrors: boolean,
  top: boolean
) {
  const {
    gen,
    schema,
    level,
    dataLevel,
    RULES,
    opts: {allErrors, extendRefs, strictNumbers, useDefaults},
  } = it
  let closingBraces2 = ""
  if (schema.$ref && !(extendRefs === true && schemaHasRulesExcept(schema, RULES.all, "$ref"))) {
    // TODO _out
    const _out = gen._out
    const code = RULES.all.$ref.code(it, "$ref")
    gen._out = _out
    gen.code(code)
    if (!allErrors) {
      // TODO refactor with below
      const errCount = top ? "0" : `errs_${level}`
      gen.code(
        `}
        if (errors === ${errCount}) {`
      )
      closingBraces2 += "}"
    }
  } else {
    for (const group of RULES) {
      if (shouldUseGroup(schema, group)) {
        if (group.type) {
          // TODO refactor `data${dataLevel || ""}`
          const checkType = checkDataType(group.type, `data${dataLevel || ""}`, strictNumbers)
          gen.code(`if (${checkType}) {`)
        }
        if (useDefaults) assignDefaults(it, group)
        let closingBraces1 = ""
        for (const rule of group.rules) {
          if (shouldUseRule(schema, rule)) {
            // TODO _out
            const _out = gen._out
            gen._out = ""
            const code = rule.code(it, rule.keyword, group.type)
            gen._out = _out
            if (code) {
              gen.code(code)
              if (!allErrors) closingBraces1 += "}"
            }
          }
        }
        if (!allErrors) gen.code(closingBraces1)
        if (group.type) {
          gen.code("}")
          if (types.length === 1 && types[0] === group.type && typeErrors) {
            gen.code(`else {`)
            reportTypeError(it)
            gen.code(`}`)
          }
        }
        if (!allErrors) {
          const errCount = top ? "0" : `errs_${level}`
          gen.code(`if (errors === ${errCount}) {`)
          closingBraces2 += "}"
        }
      }
    }
  }
  if (!allErrors) gen.code(closingBraces2)
}
