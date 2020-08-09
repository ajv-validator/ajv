// {{# def.definitions }}
// {{# def.errors }}
// {{# def.setupKeyword }}
// {{# def.$data }}

// {{# def.numberKeyword }}

// {{
//   var $op /* used in errors */, $notOp;
//   switch ($keyword) {
//     case 'maximum': $op = '<='; $notOp = '>'; break;
//     case 'minimum': $op = '>='; $notOp = '<'; break;
//     case 'exclusiveMaximum': $op = '<'; $notOp = '>='; break;
//     case 'exclusiveMinimum': $op = '>'; $notOp = '<='; break;
//     default: throw Error('not _limit keyword ' + $keyword);
//   }
// }}

// if ({{# def.$dataNotType:'number' }} {{=$data}} {{=$notOp}} {{=$schemaValue}} || {{=$data}} !== {{=$data}}) {
//   {{ var $errorKeyword = $keyword; }}
//   {{# def.error:'_limit' }}
// } {{? $breakOnError }} else { {{?}}

const {appendSchema, dataNotType} = require("../compile/util")

const OPS = {
  maximum: {fail: ">", ok: "<="},
  minimum: {fail: "<", ok: ">="},
  exclusiveMaximum: {fail: ">=", ok: "<"},
  exclusiveMinimum: {fail: "<=", ok: ">"},
}

module.exports = {
  keywords: ["maximum", "minimum", "exclusiveMaximum", "exclusiveMinimum"],
  type: "number",
  schemaType: "number",
  $data: true,
  code: ({keyword, fail, data, $data, schemaCode, schemaType}) => {
    const dnt = dataNotType($data, schemaCode, schemaType)
    fail(dnt + data + OPS[keyword].fail + schemaCode + ` || ${data}!==${data}`)
  },
  error: {
    message: ({keyword, $data, schemaCode}) =>
      `"should be ${OPS[keyword].ok} ${appendSchema($data, schemaCode)}`,
    params: ({keyword, schemaCode}) =>
      `{ comparison: "${OPS[keyword].ok}", limit: ${schemaCode} }`,
  },
}
