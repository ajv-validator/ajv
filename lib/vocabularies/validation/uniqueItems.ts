import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {checkDataType, checkDataTypes} from "../../compile/util"
import {_, str} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, data, $data, schema, parentSchema, schemaCode, it} = cxt
    if (it.opts.uniqueItems === false || !($data || schema)) return
    const i = gen.let("i")
    const j = gen.let("j")
    const valid = gen.let("valid")
    cxt.setParams({i, j})
    const itemType = parentSchema.items?.type

    // TODO refactor to have two open blocks? same as in required
    if ($data) {
      gen.if(`${schemaCode} === false || ${schemaCode} === undefined`, `${valid} = true`, () =>
        gen.if(`typeof ${schemaCode} != "boolean"`, `${valid} = false`, validateUniqueItems)
      )
    } else {
      validateUniqueItems()
    }

    cxt.pass(valid)

    function validateUniqueItems() {
      gen.code(
        `${i} = ${data}.length;
        ${valid} = true;`
      )
      gen.if(`${i} > 1`, canOptimize() ? loopN : loopN2)
    }

    function canOptimize(): boolean {
      return Array.isArray(itemType)
        ? !itemType.some((t) => t === "object" || t === "array")
        : itemType && itemType !== "object" && itemType !== "array"
    }

    function loopN(): void {
      const item = gen.name("item")
      const wrongType = (Array.isArray(itemType) ? checkDataTypes : checkDataType)(
        itemType,
        item,
        it.opts.strictNumbers,
        true
      )
      const indices = gen.const("indices", "{}")
      gen.for(_`;${i}--;`, () => {
        gen.let(item, `${data}[${i}];`)
        gen.if(wrongType, "continue")
        if (Array.isArray(itemType)) gen.if(_`typeof ${item} == "string"`, _`${item} += "_"`)
        gen
          .if(
            _`typeof ${indices}[${item}] == "number"`,
            _`${valid} = false; ${j} = ${indices}[${item}]; break;`
          )
          .code(_`${indices}[${item}] = ${i};`)
      })
    }

    function loopN2(): void {
      gen
        .code(_`outer:`)
        .for(_`;${i}--;`, () =>
          gen.for(_`${j} = ${i}; ${j}--;`, () =>
            gen.if(_`equal(${data}[${i}], ${data}[${j}])`, _`${valid} = false; break outer;`)
          )
        )
    }
  },
  error: {
    message: ({$data, params: {i, j}}) => {
      const msg = str`should NOT have duplicate items (items ## ${j} and ${i} are identical)`
      return $data ? _`(${i} === undefined ? "uniqueItems must be boolean ($data)" : ${msg})` : msg
    },
    params: ({$data, params: {i, j}}) => {
      const obj = _`{i: ${i}, j: ${j}}`
      return $data ? _`(${i} === undefined ? {} : ${obj})` : obj
    },
  },
}

module.exports = def
