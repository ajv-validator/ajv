import {CompilationContext} from "../../types"
import {toHash, checkDataTypes} from "../util"
import {schemaHasRulesForType} from "./applicability"

export function getSchemaTypes({schema, opts}: CompilationContext): string[] {
  const t = schema.type
  const types: string[] = Array.isArray(t) ? t : t || []
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
    if (typeof t != "string") throw new Error('"type" keyword must be string or string[]')
  }
}

export function coerceAndCheckDataType(it: CompilationContext, types: string[]): void {
  const {
    gen,
    dataLevel,
    opts: {coerceTypes, strictNumbers},
  } = it
  let coerceTo = coerceToTypes(types, coerceTypes)
  if (coerceTo.length || types.length > 1 || !schemaHasRulesForType(it, types[0])) {
    const wrongType = checkDataTypes(types, `data${dataLevel || ""}`, strictNumbers, true)
    gen.code(`if (${wrongType}) {`)
    if (coerceTo.length) coerceData(it, coerceTo)
    else reportTypeError(it)
    gen.code("}")
  }
}

const COERCIBLE = toHash(["string", "number", "integer", "boolean", "null"])
function coerceToTypes(types: string[], coerceTypes?: boolean | "array"): string[] {
  return coerceTypes
    ? types.filter((t) => COERCIBLE[t] || (coerceTypes === "array" && t === "array"))
    : []
}

const coerceCode = {
  number: ({dataType, data, coerced}) =>
    `if (${dataType} === "boolean" || ${data} === null
        || (${dataType} === "string' && ${data} && ${data} == +${data})) {
      ${coerced} = +${data};
    }`,
  integer: ({dataType, data, coerced}) =>
    `if (${dataType} === "boolean" || ${data} === null
        || (${dataType} === "string' && ${data} && ${data} == +${data} && !(${data} % 1))) {
      ${coerced} = +${data};
    }`,
  boolean: ({data, coerced}) =>
    `if (${data} === "false" || ${data} === 0 || ${data} === null) {
      ${coerced} = false;
    } else if (${data} === "true" || ${data} === 1) {
      ${coerced} = true;
    }`,
  null: ({data, coerced}) =>
    `if (${data} === "" || ${data} === 0 || ${data} === false) {
      ${coerced} = null;
    }`,
  array: ({dataType, data, coerced}) =>
    `if (${dataType} == 'string' || ${dataType} == 'number' || ${dataType} == 'boolean' || ${data} == null) {
      ${coerced} = [${data}];
    }`,
}

export function coerceData(
  {gen, dataLevel, opts: {coerceTypes}}: CompilationContext,
  coerceTo: string[]
): void {
  // TODO add "data" to CompilationContext
  const data = `data${dataLevel || ""}`
  const dataType = gen.name("dataType")
  const coerced = gen.name("coerced")
  gen.code(`let coerced;`)
  gen.code(`let ${dataType} = typeof ${data};`)
  if (coerceTypes === "array" && !coerceTo.includes("array")) {
    gen.code(
      `if (${dataType} === "object" && Array.isArray(${data}) && ${data}.length === 1) {
        ${coerced} = ${data} = ${data}[0];
        ${dataType} = typeof ${data};
      }`
    )
  }
  let closeBraces = ""
  coerceTo.forEach((t, i) => {
    if (i) {
      gen.code(`if (${coerced} === undefined) {`)
      closeBraces += "}"
    }
    if (coerceTypes === "array" && t !== "array") {
      gen.code(
        `if (${dataType} === "array" && ${data}.length === 1) {
          ${coerced} = ${data} = ${data}[0];
          ${dataType} = typeof ${data};
          /*if (${dataType} == 'object' && Array.isArray(${data})) ${dataType} = 'array';*/
        }`
      )
    }
    if (t in coerceCode && (t !== "array" || coerceTypes === "array")) {
      gen.code(coerceCode[t]({dataType, data, coerced}))
    }
  })
}

// {{## def.coerceType:
//   {{
//     var $dataType = 'dataType' + $lvl
//       , $coerced = 'coerced' + $lvl;
//   }}
// var {{=$dataType}} = typeof {{=$data}};
// var {{=$coerced}} = undefined;

//   {{? it.opts.coerceTypes == 'array' && !$coerceToTypes.includes('array') }}
//     if ({{=$dataType}} == 'object' && Array.isArray({{=$data}}) && {{=$data}}.length == 1) {
//       {{=$coerced}} = {{=$data}} = {{=$data}}[0];
//       {{=$dataType}} = typeof {{=$data}};
//       /*if ({{=$dataType}} == 'object' && Array.isArray({{=$data}})) {{=$dataType}} = 'array';*/
//     }
//   {{?}}

//   {{ var $bracesCoercion = ''; }}
//   {{~ $coerceToTypes:$type:$i }}
//     {{? $i }}
//       if (${coerced} === undefined) {
//       {{ $bracesCoercion += '}'; }}
//     {{?}}

//     {{? $type == 'string' }}
//       if (${dataType} == 'number' || ${dataType} == 'boolean')
//         ${coerced} = '' + ${data};
//       else if (${data} === null) ${coerced} = '';
//     {{?? $type == 'number' || $type == 'integer' }}
//       if (${dataType} == 'boolean' || ${data} === null
//           || (${dataType} == 'string' && ${data} && ${data} == +${data}
//           {{? $type == 'integer' }} && !(${data} % 1){{?}}))
//         ${coerced} = +${data};
//     {{?? $type == 'boolean' }}
//       if (${data} === 'false' || ${data} === 0 || ${data} === null)
//         ${coerced} = false;
//       else if (${data} === 'true' || ${data} === 1)
//         ${coerced} = true;
//     {{?? $type == 'null' }}
//       if (${data} === '' || ${data} === 0 || ${data} === false)
//         ${coerced} = null;
//     {{?? it.opts.coerceTypes == 'array' && $type == 'array' }}
//       if (${dataType} == 'string' || ${dataType} == 'number' || ${dataType} == 'boolean' || ${data} == null)
//         ${coerced} = [${data}];
//     {{?}}
//   {{~}}

//   {{= $bracesCoercion }}

//   if (${coerced} === undefined) {
//     {{# def.error:'type' }}
//   } else {
//     {{# def.setParentData }}
//     ${data} = ${coerced};
//     {{? !$dataLvl }}if ({{=$parentData}} !== undefined){{?}}
//       {{=$parentData}}[{{=$parentDataProperty}}] = ${coerced};
//   }
// #}}

function reportTypeError(_: CompilationContext) {}
