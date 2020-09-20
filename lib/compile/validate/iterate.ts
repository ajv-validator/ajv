import type {SchemaObjCxt} from "../../types"
import type {Rule, RuleGroup} from "../rules"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, schemaHasRulesButRef} from "../util"
import {checkStrictMode} from "../../vocabularies/util"
import {keywordCode} from "./keyword"
import {assignDefaults} from "./defaults"
import {reportTypeError} from "./dataType"
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
  if (schema.$ref && (opts.ignoreKeywordsWithRef || !schemaHasRulesButRef(schema, RULES))) {
    gen.block(() => keywordCode(it, "$ref", (RULES.all.$ref as Rule).definition)) // TODO typecast
    return
  }
  checkStrictTypes(it, types)
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

function iterateKeywords(it: SchemaObjCxt, group: RuleGroup): void {
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

function checkStrictTypes(it: SchemaObjCxt, types: string[]): void {
  if (!it.strictSchema || it.schemaEnv.meta || !it.opts.strictTypes) return
  checkMultipleTypes(it, types, it.opts.strictTypes)
  checkApplicableTypes(it, types, it.opts.strictTypes)
}

function checkMultipleTypes(it: SchemaObjCxt, ts: string[], mode: boolean | "log"): void {
  if (
    ts.length > 1 &&
    !(ts.length === 2 && ts.includes("null")) &&
    (ts.includes("object") || ts.includes("array"))
  ) {
    strictTypesError(it, "multiple non-primitive types", mode)
  }
}

function checkApplicableTypes(it: SchemaObjCxt, ts: string[], mode: boolean | "log"): void {
  const rules = it.self.RULES.all
  for (const keyword in rules) {
    const rule = rules[keyword]
    if (typeof rule == "object" && shouldUseRule(it.schema, rule)) {
      const {type} = rule.definition
      if (Array.isArray(type)) {
        if (!type.some((t) => hasApplicableType(ts, t))) {
          strictTypesError(it, "missing appllicable type", mode)
          return
        }
      } else if (type) {
        if (!hasApplicableType(ts, type)) {
          strictTypesError(it, "missing appllicable type", mode)
          return
        }
      }
    }
  }
}

function hasApplicableType(schemaTypes: string[], keywordType: string): boolean {
  return (
    schemaTypes.includes(keywordType) ||
    (keywordType === "number" && schemaTypes.includes("integer"))
  )
}

function strictTypesError(it: SchemaObjCxt, msg: string, mode: boolean | "log"): void {
  const schemaPath = it.schemaEnv.baseId + it.errSchemaPath
  msg += ` at "${schemaPath}/type" (strictTypes)`
  throw new Error(msg)
  checkStrictMode(it, msg, mode)
}
