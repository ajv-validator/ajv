import {CompilationContext} from "../../types"
import {RuleGroup, Rule} from "../rules"

export function schemaHasRulesForType({RULES, schema}: CompilationContext, ty: string): boolean {
  const group = RULES.types[ty]
  return group && group !== true && shouldUseGroup(schema, group)
}

export function shouldUseGroup(schema: object, group: RuleGroup): boolean {
  // TODO remove type cast to Rule
  return group.rules.some((rule) => shouldUseRule(schema, <Rule>rule))
}

export function shouldUseRule(schema: object, rule: Rule): boolean | undefined {
  return schema[rule.keyword] !== undefined || ruleImplementsSomeKeyword(schema, rule)
}

function ruleImplementsSomeKeyword(schema: object, rule: Rule): boolean | undefined {
  return rule.implements?.some((kwd) => schema[kwd] !== undefined)
}
