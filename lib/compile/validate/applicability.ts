import {SchemaObjCxt, SchemaObject} from "../../types"
import {RuleGroup, Rule} from "../rules"

export function schemaHasRulesForType({schema, self}: SchemaObjCxt, ty: string): boolean {
  const group = self.RULES.types[ty]
  return group && group !== true && shouldUseGroup(schema, group)
}

export function shouldUseGroup(schema: SchemaObject, group: RuleGroup): boolean {
  return group.rules.some((rule) => shouldUseRule(schema, rule))
}

export function shouldUseRule(schema: SchemaObject, rule: Rule): boolean | undefined {
  return (
    schema[rule.keyword] !== undefined ||
    rule.definition.implements?.some((kwd) => schema[kwd] !== undefined)
  )
}
