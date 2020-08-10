// {{# def.definitions }}
// {{# def.errors }}
// {{# def.setupKeyword }}
// {{# def.$data }}

// {{# def.numberKeyword }}

// var division{{=$lvl}};
// if ({{?$isData}}
//       {{=$schemaValue}} !== undefined && (
//       typeof {{=$schemaValue}} != 'number' ||
//     {{?}}
//       (division{{=$lvl}} = {{=$data}} / {{=$schemaValue}},
//       {{? it.opts.multipleOfPrecision }}
//         Math.abs(Math.round(division{{=$lvl}}) - division{{=$lvl}}) > 1e-{{=it.opts.multipleOfPrecision}}
//       {{??}}
//         division{{=$lvl}} !== parseInt(division{{=$lvl}})
//       {{?}}
//       )
//     {{?$isData}}  )  {{?}} ) {
//   {{# def.error:'multipleOf' }}
// } {{? $breakOnError }} else { {{?}}

import {KeywordDefinition} from "../../types"
import {appendSchema, dataNotType} from "../util"

const SCH_TYPE = "number"

const def: KeywordDefinition = {
  keywords: ["multipleOf"],
  type: "number",
  schemaType: SCH_TYPE,
  $data: true,
  code({write, fail, data, $data, schemaCode, level, opts}) {
    const dnt = dataNotType(schemaCode, SCH_TYPE, $data)
    const res = `division${level}`
    const prec = opts.multipleOfPrecision
    const invalid = prec
      ? `Math.abs(Math.round(${res}) - ${res}) > 1e-${prec}`
      : `${res} !== parseInt(${res})`
    // TODO replace with let
    write(`var ${res};`)
    fail(dnt + `(${res} = ${data}/${schemaCode}, ${invalid})`)
  },
  error: {
    message: ({$data, schemaCode}) =>
      `"should be multiple of ${appendSchema(schemaCode, $data)}`,
    params: ({schemaCode}) => `{multipleOf: ${schemaCode}}`,
  },
}

module.exports = def
