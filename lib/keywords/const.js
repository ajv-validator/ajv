"use strict"

// {{# def.definitions }}
// {{# def.errors }}
// {{# def.setupKeyword }}
// {{# def.$data }}

// {{? !$isData }}
//   var schema{{=$lvl}} = validate.schema{{=$schemaPath}};
// {{?}}
// var {{=$valid}} = equal({{=$data}}, schema{{=$lvl}});
// {{# def.checkError:'const' }}
// {{? $breakOnError }} else { {{?}}

module.exports = {
  keywords: ["const"],
  $data: true,
  code: ({fail, data, schemaCode}) => fail(`!equal(${data}, ${schemaCode})`),
  error: {
    message: () => '"should be equal to constant"',
    params: ({schemaCode}) => `{ allowedValue: ${schemaCode} }`,
  },
}
