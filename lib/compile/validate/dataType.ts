import {CompilationContext, KeywordErrorDefinition, KeywordErrorContext} from "../../types"
import {toHash, checkDataType, checkDataTypes, DataType} from "../util"
import {schemaRefOrVal} from "../../vocabularies/util"
import {schemaHasRulesForType} from "./applicability"
import {reportError} from "../errors"
import {_, str, Name} from "../codegen"

export function getSchemaTypes({schema, opts, RULES}: CompilationContext): string[] {
  const st: undefined | string | string[] = schema.type
  const types: string[] = Array.isArray(st) ? st : st ? [st] : []
  types.forEach(checkType)
  if (opts.nullable) {
    const hasNull = types.includes("null")
    if (hasNull && schema.nullable === false) {
      throw new Error('{"type": "null"} contradicts {"nullable": "false"}')
    } else if (!hasNull && schema.nullable === true) {
      types.push("null")
    }
  }
  return types

  function checkType(t: string): void {
    if (typeof t == "string" && t in RULES.types) return
    throw new Error('"type" keyword must be allowed string or string[]: ' + t)
  }
}

export function coerceAndCheckDataType(it: CompilationContext, types: string[]): boolean {
  const {gen, data, opts} = it
  const coerceTo = coerceToTypes(types, opts.coerceTypes)
  const checkTypes =
    types.length > 0 &&
    !(coerceTo.length === 0 && types.length === 1 && schemaHasRulesForType(it, types[0]))
  if (checkTypes) {
    const wrongType = checkDataTypes(types, data, opts.strictNumbers, DataType.Wrong)
    gen.if(wrongType, () => {
      if (coerceTo.length) coerceData(it, coerceTo)
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

export function coerceData(it: CompilationContext, coerceTo: string[]): void {
  const {gen, schema, data, opts} = it
  const dataType = gen.let("dataType", _`typeof ${data}`)
  const coerced = gen.let("coerced")
  if (opts.coerceTypes === "array") {
    gen.if(_`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () =>
      gen
        .assign(data, _`${data}[0]`)
        .assign(dataType, _`typeof ${data}`)
        .if(checkDataType(schema.type, data, opts.strictNumbers), () => gen.assign(coerced, data))
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

  function coerceSpecificType(t) {
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

function assignParentData(
  {gen, parentData, parentDataProperty}: CompilationContext,
  expr: Name
): void {
  // TODO use gen.property
  gen.if(_`${parentData} !== undefined`, () =>
    gen.assign(_`${parentData}[${parentDataProperty}]`, expr)
  )
}

const typeError: KeywordErrorDefinition = {
  message: ({schema}) =>
    str`should be ${Array.isArray(schema) ? schema.join(",") : <string>schema}`,
  // TODO change: return type as array here
  params: ({schema}) => _`{type: ${Array.isArray(schema) ? schema.join(",") : <string>schema}}`,
}

export function reportTypeError(it: CompilationContext): void {
  const cxt = getErrorContext(it, "type")
  reportError(cxt, typeError)
}

function getErrorContext(it: CompilationContext, keyword: string): KeywordErrorContext {
  const {gen, data, schema} = it
  const schemaCode = schemaRefOrVal(it, schema, keyword)
  return {
    gen,
    keyword,
    data,
    schema: schema[keyword],
    schemaCode,
    schemaValue: schemaCode,
    parentSchema: schema,
    params: {},
    it,
  }
}
