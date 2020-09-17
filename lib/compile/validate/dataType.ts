import type {
  SchemaObjCxt,
  KeywordErrorDefinition,
  KeywordErrorCxt,
  ErrorObject,
  AnySchemaObject,
} from "../../types"
import type {ValidationRules} from "../rules"
import {schemaHasRulesForType} from "./applicability"
import {toHash, checkDataTypes, DataType} from "../util"
import {schemaRefOrVal} from "../../vocabularies/util"
import {reportError} from "../errors"
import {_, str, Name} from "../codegen"

export function getSchemaTypes({self}: SchemaObjCxt, schema: AnySchemaObject): string[] {
  const st: undefined | string | string[] = schema.type
  const types: string[] = Array.isArray(st) ? st : st ? [st] : []
  types.forEach((t) => checkType(t, self.RULES))
  const hasNull = types.includes("null")
  if (hasNull && schema.nullable === false) {
    throw new Error('{"type": "null"} contradicts {"nullable": "false"}')
  } else if (!hasNull && schema.nullable === true) {
    types.push("null")
  }
  return types
}

export function checkType(t: string, RULES: ValidationRules): void {
  if (typeof t == "string" && t in RULES.types) return
  throw new Error('"type" keyword must be allowed string or string[]: ' + t)
}

export function coerceAndCheckDataType(it: SchemaObjCxt, types: string[]): boolean {
  const {gen, data, opts} = it
  const coerceTo = coerceToTypes(types, opts.coerceTypes)
  const checkTypes =
    types.length > 0 &&
    !(coerceTo.length === 0 && types.length === 1 && schemaHasRulesForType(it, types[0]))
  if (checkTypes) {
    const wrongType = checkDataTypes(types, data, opts.strict, DataType.Wrong)
    gen.if(wrongType, () => {
      if (coerceTo.length) coerceData(it, types, coerceTo)
      else reportTypeError(it)
    })
  }
  return checkTypes
}

const COERCIBLE = toHash(["string", "number", "integer", "boolean", "null"])
function coerceToTypes(types: string[], coerceTypes?: boolean | "array"): string[] {
  return coerceTypes
    ? types.filter((t) => COERCIBLE[t] || (coerceTypes === "array" && t === "array"))
    : []
}

function coerceData(it: SchemaObjCxt, types: string[], coerceTo: string[]): void {
  const {gen, data, opts} = it
  const dataType = gen.let("dataType", _`typeof ${data}`)
  const coerced = gen.let("coerced", _`undefined`)
  if (opts.coerceTypes === "array") {
    gen.if(_`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () =>
      gen
        .assign(data, _`${data}[0]`)
        .assign(dataType, _`typeof ${data}`)
        .if(checkDataTypes(types, data, opts.strict), () => gen.assign(coerced, data))
    )
  }
  gen.if(_`${coerced} !== undefined`)
  for (const t of coerceTo) {
    if (t in COERCIBLE || (t === "array" && opts.coerceTypes === "array")) {
      coerceSpecificType(t)
    }
  }
  gen.else()
  reportTypeError(it)
  gen.endIf()

  gen.if(_`${coerced} !== undefined`, () => {
    gen.assign(data, coerced)
    assignParentData(it, coerced)
  })

  function coerceSpecificType(t: string): void {
    switch (t) {
      case "string":
        gen
          .elseIf(_`${dataType} == "number" || ${dataType} == "boolean"`)
          .assign(coerced, _`"" + ${data}`)
          .elseIf(_`${data} === null`)
          .assign(coerced, _`""`)
        return
      case "number":
        gen
          .elseIf(
            _`${dataType} == "boolean" || ${data} === null
              || (${dataType} == "string" && ${data} && ${data} == +${data})`
          )
          .assign(coerced, _`+${data}`)
        return
      case "integer":
        gen
          .elseIf(
            _`${dataType} === "boolean" || ${data} === null
              || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`
          )
          .assign(coerced, _`+${data}`)
        return
      case "boolean":
        gen
          .elseIf(_`${data} === "false" || ${data} === 0 || ${data} === null`)
          .assign(coerced, false)
          .elseIf(_`${data} === "true" || ${data} === 1`)
          .assign(coerced, true)
        return
      case "null":
        gen.elseIf(_`${data} === "" || ${data} === 0 || ${data} === false`)
        gen.assign(coerced, null)
        return

      case "array":
        gen
          .elseIf(
            _`${dataType} === "string" || ${dataType} === "number"
              || ${dataType} === "boolean" || ${data} === null`
          )
          .assign(coerced, _`[${data}]`)
    }
  }
}

function assignParentData({gen, parentData, parentDataProperty}: SchemaObjCxt, expr: Name): void {
  // TODO use gen.property
  gen.if(_`${parentData} !== undefined`, () =>
    gen.assign(_`${parentData}[${parentDataProperty}]`, expr)
  )
}

export type TypeError = ErrorObject<"type", {type: string}>

const typeError: KeywordErrorDefinition = {
  message: ({schema}) => str`should be ${schema}`,
  params: ({schema, schemaValue}) =>
    typeof schema == "string" ? _`{type: ${schema}}` : _`{type: ${schemaValue}}`,
}

export function reportTypeError(it: SchemaObjCxt): void {
  const cxt = getTypeErrorContext(it)
  reportError(cxt, typeError)
}

function getTypeErrorContext(it: SchemaObjCxt): KeywordErrorCxt {
  const {gen, data, schema} = it
  const schemaCode = schemaRefOrVal(it, schema, "type")
  return {
    gen,
    keyword: "type",
    data,
    schema: schema.type,
    schemaCode,
    schemaValue: schemaCode,
    parentSchema: schema,
    params: {},
    it,
  }
}
