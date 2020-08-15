import {CompilationContext} from "../../types"

export function schemaHasRulesForType({RULES, schema}: CompilationContext, ty: string) {
  const group = RULES.types[ty]
  return group && group !== true && shouldUseGroup(schema, group)
}

function shouldUseGroup(schema, group): boolean {
  return group.rules.some((rule) => shouldUseRule(schema, rule))
}

function shouldUseRule(schema, rule): boolean {
  return schema[rule.keyword] !== undefined || ruleImplementsSomeKeyword(schema, rule)
}

function ruleImplementsSomeKeyword(schema, rule): boolean {
  return rule.implements && rule.implements.some((kwd) => schema[kwd] !== undefined)
}
