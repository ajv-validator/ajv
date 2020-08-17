import {CompilationContext, KeywordErrorDefinition} from "../../types"
import {toHash, checkDataType, checkDataTypes} from "../util"
import {schemaHasRulesForType} from "./applicability"
import {reportError} from "../errors"
import {getKeywordContext} from "../../keyword"

export function getSchemaTypes({schema, opts}: CompilationContext): string[] {
  const t: undefined | string | string[] = schema.type
  const types: string[] = Array.isArray(t) ? t : t ? [t] : []
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
    // TODO check that type is allowed
    if (typeof t != "string") throw new Error('"type" keyword must be string or string[]: ' + t)
  }
}

export function coerceAndCheckDataType(it: CompilationContext, types: string[]): boolean {
  const {
    gen,
    dataLevel,
    opts: {coerceTypes, strictNumbers},
  } = it
  let coerceTo = coerceToTypes(types, coerceTypes)
  const checkTypes =
    types.length > 0 &&
    (coerceTo.length > 0 || types.length > 1 || !schemaHasRulesForType(it, types[0]))
  if (checkTypes) {
    // TODO refactor `data${dataLevel || ""}`
    const wrongType = checkDataTypes(types, `data${dataLevel || ""}`, strictNumbers, true)
    gen.code(`if (${wrongType}) {`)
    if (coerceTo.length) coerceData(it, coerceTo)
    else reportTypeError(it)
    gen.code("}")
  }
  return checkTypes
}

const COERCIBLE = toHash(["string", "number", "integer", "boolean", "null"])
function coerceToTypes(types: string[], coerceTypes?: boolean | "array"): string[] {
  return coerceTypes
    ? types.filter((t) => COERCIBLE[t] || (coerceTypes === "array" && t === "array"))
    : []
}

const coerceCode = {
  string: ({dataType, data, coerced}) =>
    `else if (${dataType} == "number" || ${dataType} == "boolean")
      ${coerced} = "" + ${data};
    else if (${data} === null)
      ${coerced} = "";`,
  number: ({dataType, data, coerced}) =>
    `else if (${dataType} == "boolean" || ${data} === null
      || (${dataType} == "string" && ${data} && ${data} == +${data}))
      ${coerced} = +${data};`,
  integer: ({dataType, data, coerced}) =>
    `else if (${dataType} === "boolean" || ${data} === null
      || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1)))
      ${coerced} = +${data};`,
  boolean: ({data, coerced}) =>
    `else if (${data} === "false" || ${data} === 0 || ${data} === null)
      ${coerced} = false;
    else if (${data} === "true" || ${data} === 1)
      ${coerced} = true;`,
  null: ({data, coerced}) =>
    `else if (${data} === "" || ${data} === 0 || ${data} === false)
      ${coerced} = null;`,
  array: ({dataType, data, coerced}) =>
    `else if (${dataType} === "string" || ${dataType} === "number" || ${dataType} === "boolean" || ${data} === null)
      ${coerced} = [${data}];`,
}

export function coerceData(it: CompilationContext, coerceTo: string[]): void {
  const {
    gen,
    schema,
    dataLevel,
    opts: {coerceTypes, strictNumbers},
  } = it
  // TODO use "data" to CompilationContext
  const data = `data${dataLevel || ""}`
  const dataType = gen.name("dataType")
  const coerced = gen.name("coerced")
  gen.code(`let ${coerced};`)
  gen.code(`let ${dataType} = typeof ${data};`)
  if (coerceTypes === "array") {
    gen.code(
      `if (${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1) {
        ${data} = ${data}[0];
        ${dataType} = typeof ${data};
        if (${checkDataType(schema.type, data, strictNumbers)})
          ${coerced} = ${data};
      }`
    )
  }
  gen.code(`if (${coerced} !== undefined) ;`)
  const args = {dataType, data, coerced}
  for (const t of coerceTo) {
    if (t in coerceCode && (t !== "array" || coerceTypes === "array")) {
      gen.code(coerceCode[t](args))
    }
  }
  gen.code(`else {`)
  reportTypeError(it)
  gen.code(`}`)

  gen.code(
    `if (${coerced} !== undefined) {
      ${data} = ${coerced};
      ${assignParentData(it, coerced)}
    }`
  )
}

function assignParentData({dataLevel, dataPathArr}: CompilationContext, expr: string): string {
  // TODO replace dataLevel
  if (dataLevel) {
    const parentData = "data" + (dataLevel - 1 || "")
    return `${parentData}[${dataPathArr[dataLevel]}] = ${expr};`
  }
  return `if (parentData !== undefined) parentData[parentDataProperty] = ${expr};`
}

const typeError: KeywordErrorDefinition = {
  message: ({schema}) => `"should be ${Array.isArray(schema) ? schema.join(",") : schema}"`,
  // TODO change: return type as array here
  params: ({schema}) => `{type: "${Array.isArray(schema) ? schema.join(",") : schema}"}`,
}

export function reportTypeError(it: CompilationContext) {
  const cxt = getKeywordContext(it, "type")
  reportError(cxt, typeError)
}
