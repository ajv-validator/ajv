import {SchemaObjCxt} from "../../types"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, schemaHasRulesButRef} from "../util"
import {keywordCode} from "./keyword"
import {assignDefaults} from "./defaults"
import {reportTypeError} from "./dataType"
import {Rule, RuleGroup} from "../rules"
import {_, Name} from "../codegen"
import N from "../names"

export function schemaKeywords(
  it: SchemaObjCxt,
  types: string[],
  typeErrors: boolean,
  errsCount?: Name
): void {
  const {gen, schema, data, allErrors, opts, self} = it
  const {RULES} = self
  if (schema.$ref && !(opts.extendRefs === true && schemaHasRulesButRef(schema, RULES))) {
    gen.block(() => keywordCode(it, "$ref", (RULES.all.$ref as Rule).definition)) // TODO typecast
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
      gen.if(checkDataType(group.type, data, opts.strict))
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

function iterateKeywords(it: SchemaObjCxt, group: RuleGroup) {
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
