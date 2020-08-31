import {CompilationContext} from "../../types"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, schemaHasRulesExcept} from "../util"
import {keywordCode} from "./keyword"
import {assignDefaults} from "./defaults"
import {reportTypeError} from "./dataType"
import {Rule, RuleGroup} from "../rules"
import {_, Name} from "../codegen"
import N from "../names"

export function schemaKeywords(
  it: CompilationContext,
  types: string[],
  typeErrors: boolean,
  errsCount?: Name
): void {
  const {gen, schema, data, RULES, allErrors, opts} = it
  if (
    schema.$ref &&
    !(opts.extendRefs === true && schemaHasRulesExcept(schema, RULES.all, "$ref"))
  ) {
    gen.block(() => keywordCode(it, "$ref", (<Rule>RULES.all.$ref).definition)) // TODO typecast
    return
  }
  gen.block(() => {
    for (const group of RULES.rules) {
      if (shouldUseGroup(schema, group)) {
        groupKeywords(group)
      }
    }
  })

  function groupKeywords(group: RuleGroup): void {
    if (group.type) {
      const checkType = checkDataType(group.type, data, opts.strictNumbers)
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
    // TODO make it "ok" call?
    if (!allErrors) gen.if(_`${N.errors} === ${errsCount || 0}`)
  }
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
        keywordCode(it, rule.keyword, rule.definition, group.type)
      }
    }
  })
}