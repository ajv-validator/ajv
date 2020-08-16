import {CompilationContext} from "../../types"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, schemaHasRulesExcept} from "../util"
import {assignDefaults} from "./defaults"
import {reportTypeError} from "./dataType"
import {RuleGroup, Rule} from "../rules"

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
    opts: {allErrors, extendRefs, strictNumbers},
  } = it
  if (schema.$ref && !(extendRefs === true && schemaHasRulesExcept(schema, RULES.all, "$ref"))) {
    // TODO remove Rule type cast
    ;(RULES.all.$ref as Rule).code(it, "$ref")
    if (!allErrors) gen.code("}")
    return
  }
  let closeBlocks = ""
  const ruleGroups = RULES.rules.filter((group) => shouldUseGroup(schema, group))
  const last = ruleGroups.length - 1
  ruleGroups.forEach((group, i) => {
    if (group.type) {
      // TODO refactor `data${dataLevel || ""}`
      const checkType = checkDataType(group.type, `data${dataLevel || ""}`, strictNumbers)
      gen.code(`if (${checkType}) {`)
      iterateKeywords(it, group)
      if (types.length === 1 && types[0] === group.type && typeErrors) {
        gen.code(`} else {`)
        reportTypeError(it)
      }
      gen.code("}")
    } else {
      iterateKeywords(it, group)
    }
    if (!allErrors && i < last) {
      const errCount = top ? "0" : `errs_${level}`
      gen.code(`if (errors === ${errCount}) {`)
      closeBlocks += "}"
    }
  })
  if (!allErrors) gen.code(closeBlocks)
}

function iterateKeywords(it: CompilationContext, group: RuleGroup) {
  const {
    gen,
    schema,
    opts: {allErrors, useDefaults},
  } = it
  if (useDefaults) assignDefaults(it, group.type)
  let closeBlocks = ""
  // TODO remove Rule type cast
  for (const rule of group.rules as Rule[]) {
    if (shouldUseRule(schema, rule)) {
      // TODO _outLen
      const _outLen = gen._out.length
      rule.code(it, rule.keyword, group.type)
      if (_outLen < gen._out.length) {
        if (!allErrors) closeBlocks += "}"
      }
    }
  }
  if (!allErrors) gen.code(closeBlocks)
}
