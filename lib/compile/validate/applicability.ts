import type {SchemaObjCxt, AnySchemaObject} from "../../types"
import type {RuleGroup, Rule} from "../rules"

export function schemaHasRulesForType(
  {schema, self}: SchemaObjCxt,
  ty: string
): boolean | undefined {
  const group = self.RULES.types[ty]
  return group && group !== true && shouldUseGroup(schema, group)
}

export function shouldUseGroup(schema: AnySchemaObject, group: RuleGroup): boolean {
  return group.rules.some((rule) => shouldUseRule(schema, rule))
}

export function shouldUseRule(schema: AnySchemaObject, rule: Rule): boolean | undefined {
  return (
    schema[rule.keyword] !== undefined ||
    rule.definition.implements?.some((kwd) => schema[kwd] !== undefined)
  )
}
