import type {SchemaObjCxt} from ".."
import type {JSONType, Rule, RuleGroup} from "../rules"
import {shouldUseGroup, shouldUseRule} from "./applicability"
import {checkDataType, reportTypeError} from "./dataType"
import {assignDefaults} from "./defaults"
import {keywordCode} from "./keyword"
import {schemaHasRulesButRef} from "../util"
import {checkStrictMode} from "."
import {_, Name} from "../codegen"
import N from "../names"

export function schemaKeywords(
  it: SchemaObjCxt,
  types: JSONType[],
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
    for (const group of RULES.rules) groupKeywords(group)
    groupKeywords(RULES.post)
  })

  function groupKeywords(group: RuleGroup): void {
    if (!shouldUseGroup(schema, group)) return
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

function checkStrictTypes(it: SchemaObjCxt, types: JSONType[]): void {
  if (it.schemaEnv.meta || !it.opts.strictTypes) return
  checkContextTypes(it, types)
  if (!it.opts.allowUnionTypes) checkMultipleTypes(it, types)
  checkKeywordTypes(it, it.dataTypes)
}

function checkContextTypes(it: SchemaObjCxt, types: JSONType[]): void {
  if (!types.length) return
  if (!it.dataTypes.length) {
    it.dataTypes = types
    return
  }
  types.forEach((t) => {
    if (!includesType(it.dataTypes, t)) {
      strictTypesError(it, `type "${t}" not allowed by context "${it.dataTypes.join(",")}"`)
    }
  })
  it.dataTypes = it.dataTypes.filter((t) => includesType(types, t))
}

function checkMultipleTypes(it: SchemaObjCxt, ts: JSONType[]): void {
  if (ts.length > 1 && !(ts.length === 2 && ts.includes("null"))) {
    strictTypesError(it, "use allowUnionTypes to allow union type keyword")
  }
}

function checkKeywordTypes(it: SchemaObjCxt, ts: JSONType[]): void {
  const rules = it.self.RULES.all
  for (const keyword in rules) {
    const rule = rules[keyword]
    if (typeof rule == "object" && shouldUseRule(it.schema, rule)) {
      const {type} = rule.definition
      if (type.length && !type.some((t) => hasApplicableType(ts, t))) {
        strictTypesError(it, `missing type "${type.join(",")}" for keyword "${keyword}"`)
      }
    }
  }
}

function hasApplicableType(schTs: JSONType[], kwdT: JSONType): boolean {
  return schTs.includes(kwdT) || (kwdT === "number" && schTs.includes("integer"))
}

function includesType(ts: JSONType[], t: JSONType): boolean {
  return ts.includes(t) || (t === "integer" && ts.includes("number"))
}

function strictTypesError(it: SchemaObjCxt, msg: string): void {
  const schemaPath = it.schemaEnv.baseId + it.errSchemaPath
  msg += ` at "${schemaPath}" (strictTypes)`
  checkStrictMode(it, msg, it.opts.strictTypes)
}
