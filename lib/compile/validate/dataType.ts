import {CompilationContext, KeywordErrorDefinition} from "../../types"
import {toHash, checkDataType, checkDataTypes} from "../util"
import {schemaHasRulesForType} from "./applicability"
import {reportError} from "../errors"
import {getKeywordContext} from "../../keyword"
import {_, Name} from "../codegen"

export function getSchemaTypes({schema, opts}: CompilationContext): string[] {
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
  const coerceTo = coerceToTypes(types, coerceTypes)
  const checkTypes =
    types.length > 0 &&
    !(coerceTo.length === 0 && types.length === 1 && schemaHasRulesForType(it, types[0]))
  if (checkTypes) {
    // TODO refactor `data${dataLevel || ""}`
    const wrongType = checkDataTypes(types, new Name(`data${dataLevel || ""}`), strictNumbers, true)
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
  const {
    gen,
    schema,
    dataLevel,
    opts: {coerceTypes, strictNumbers},
  } = it
  // TODO move "data" to CompilationContext
  const data = new Name(`data${dataLevel || ""}`)
  const dataType = gen.let("dataType", `typeof ${data}`)
  const coerced = gen.let("coerced")
  if (coerceTypes === "array") {
    gen.if(_`${dataType} == 'object' && Array.isArray(${data}) && ${data}.length == 1`, () =>
      gen
        .code(_`${data} = ${data}[0]; ${dataType} = typeof ${data};`)
        .if(checkDataType(schema.type, data, strictNumbers), _`${coerced} = ${data}`)
    )
  }
  gen.if(`${coerced} !== undefined`)
  for (const t of coerceTo) {
    if (t in COERCIBLE || (t === "array" && coerceTypes === "array")) {
      coerceSpecificType(t)
    }
  }
  gen.else()
  reportTypeError(it)
  gen.endIf()

  gen.if(`${coerced} !== undefined`, () => {
    gen.code(`${data} = ${coerced};`)
    assignParentData(it, coerced)
  })

  function coerceSpecificType(t) {
    switch (t) {
      case "string":
        gen
          .elseIf(`${dataType} == "number" || ${dataType} == "boolean"`)
          .code(`${coerced} = "" + ${data}`)
          .elseIf(`${data} === null`)
          .code(`${coerced} = ""`)
        return
      case "number":
        gen
          .elseIf(
            `${dataType} == "boolean" || ${data} === null
          || (${dataType} == "string" && ${data} && ${data} == +${data})`
          )
          .code(`${coerced} = +${data}`)
        return
      case "integer":
        gen
          .elseIf(
            `${dataType} === "boolean" || ${data} === null
          || (${dataType} === "string" && ${data} && ${data} == +${data} && !(${data} % 1))`
          )
          .code(`${coerced} = +${data}`)
        return
      case "boolean":
        gen
          .elseIf(`${data} === "false" || ${data} === 0 || ${data} === null`)
          .code(`${coerced} = false`)
          .elseIf(`${data} === "true" || ${data} === 1`)
          .code(`${coerced} = true`)
        return
      case "null":
        gen.elseIf(`${data} === "" || ${data} === 0 || ${data} === false`)
        gen.code(`${coerced} = null`)
        return

      case "array":
        gen
          .elseIf(
            `${dataType} === "string" || ${dataType} === "number"
          || ${dataType} === "boolean" || ${data} === null`
          )
          .code(`${coerced} = [${data}]`)
    }
  }
}

function assignParentData(
  {gen, dataLevel, dataPathArr}: CompilationContext,
  expr: string | Name
): void {
  // TODO replace dataLevel
  if (dataLevel) {
    const parentData = "data" + (dataLevel - 1 || "")
    gen.code(`${parentData}[${dataPathArr[dataLevel]}] = ${expr};`)
  } else {
    gen.if("parentData !== undefined", `parentData[parentDataProperty] = ${expr};`)
  }
}

const typeError: KeywordErrorDefinition = {
  message: ({schema}) => `"should be ${Array.isArray(schema) ? schema.join(",") : <string>schema}"`,
  // TODO change: return type as array here
  params: ({schema}) => `{type: "${Array.isArray(schema) ? schema.join(",") : <string>schema}"}`,
}

export function reportTypeError(it: CompilationContext): void {
  const cxt = getKeywordContext(it, "type")
  reportError(cxt, typeError)
}
