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
  errsCount?: string
): void {
  const {
    gen,
    schema,
    dataLevel,
    RULES,
    allErrors,
    opts: {extendRefs, strictNumbers},
  } = it
  if (schema.$ref && !(extendRefs === true && schemaHasRulesExcept(schema, RULES.all, "$ref"))) {
    // TODO remove Rule type cast
    gen.block(() => (RULES.all.$ref as Rule).code(it, "$ref"))
    return
  }
  const ruleGroups = RULES.rules.filter((group) => shouldUseGroup(schema, group))
  const last = ruleGroups.length - 1
  gen.block(() =>
    ruleGroups.forEach((group, i) => {
      if (group.type) {
        // TODO refactor `data${dataLevel || ""}`
        const checkType = checkDataType(group.type, `data${dataLevel || ""}`, strictNumbers)
        gen.if(checkType)
        iterateKeywords(it, group)
        if (types.length === 1 && types[0] === group.type && typeErrors) {
          gen.else()
          reportTypeError(it)
        }
        gen.endIf()
      } else {
        iterateKeywords(it, group)
      }
      if (!allErrors && i < last) {
        gen.if(`errors === ${errsCount || 0}`)
      }
    })
  )
}

function iterateKeywords(it: CompilationContext, group: RuleGroup) {
  const {
    gen,
    schema,
    opts: {useDefaults},
  } = it
  if (useDefaults) assignDefaults(it, group.type)
  gen.block(() => {
    for (const rule of group.rules) {
      if (shouldUseRule(schema, rule)) {
        rule.code(it, rule.keyword, group.type)
      }
    }
  })
}
