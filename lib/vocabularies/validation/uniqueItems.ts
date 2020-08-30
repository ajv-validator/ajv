import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {checkDataType, checkDataTypes} from "../../compile/util"
import {_, str, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, parentSchema, schemaCode, it} = cxt
    if (it.opts.uniqueItems === false || !($data || schema)) return
    const valid = gen.let("valid")
    const itemType = parentSchema.items?.type

    if ($data) {
      gen.if(_`${schemaCode} === false || ${schemaCode} === undefined`)
      gen.assign(valid, true)
      gen.elseIf(_`typeof ${schemaCode} != "boolean"`)
      cxt.$dataError()
      gen.assign(valid, false)
      gen.else()
      validateUniqueItems()
      gen.endIf()
    } else {
      validateUniqueItems()
    }
    cxt.ok(valid)

    function validateUniqueItems() {
      const i = gen.let("i", _`${data}.length`)
      const j = gen.let("j")
      cxt.setParams({i, j})
      gen.assign(valid, true)
      gen.if(_`${i} > 1`, () => (canOptimize() ? loopN : loopN2)(i, j))
    }

    function canOptimize(): boolean {
      return Array.isArray(itemType)
        ? !itemType.some((t) => t === "object" || t === "array")
        : itemType && itemType !== "object" && itemType !== "array"
    }

    function loopN(i: Name, j: Name): void {
      const item = gen.name("item")
      const wrongType = (Array.isArray(itemType) ? checkDataTypes : checkDataType)(
        itemType,
        item,
        it.opts.strictNumbers,
        true
      )
      const indices = gen.const("indices", _`{}`)
      gen.for(_`;${i}--;`, () => {
        gen.let(item, _`${data}[${i}];`)
        gen.if(wrongType, _`continue`)
        if (Array.isArray(itemType)) gen.if(_`typeof ${item} == "string"`, _`${item} += "_"`)
        gen
          .if(_`typeof ${indices}[${item}] == "number"`, () => {
            gen.assign(j, _`${indices}[${item}]`)
            cxt.error()
            gen.assign(valid, false).break()
          })
          .code(_`${indices}[${item}] = ${i};`)
      })
    }

    function loopN2(i: Name, j: Name): void {
      gen.code(_`outer:`).for(_`;${i}--;`, () =>
        gen.for(_`${j} = ${i}; ${j}--;`, () =>
          gen.if(_`equal(${data}[${i}], ${data}[${j}])`, () => {
            cxt.error()
            gen.assign(valid, false).break(_`outer`)
          })
        )
      )
    }
  },
  error: {
    message: ({params: {i, j}}) =>
      str`should NOT have duplicate items (items ## ${j} and ${i} are identical)`,
    params: ({params: {i, j}}) => _`{i: ${i}, j: ${j}}`,
  },
  $dataError: {
    message: "uniqueItems must be boolean ($data)",
  },
}

module.exports = def
