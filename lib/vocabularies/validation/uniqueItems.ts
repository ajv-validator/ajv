import {KeywordDefinition} from "../../types"
import {checkDataType, checkDataTypes} from "../../compile/util"

const def: KeywordDefinition = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  code({gen, fail, ok, errorParams, data, $data, schema, parentSchema, schemaCode, it: {opts}}) {
    if (opts.uniqueItems === false || !($data || schema)) return ok()
    const i = gen.name("i")
    const j = gen.name("j")
    const valid = gen.name("valid")
    errorParams({i, j})
    gen.code(`let ${valid}, ${i}, ${j};`)
    const itemType = parentSchema.items?.type

    if ($data) {
      gen.if(`${schemaCode} === false || ${schemaCode} === undefined`, `${valid} = true`, () =>
        gen.if(`typeof ${schemaCode} != "boolean"`, `${valid} = false`, validateUniqueItems)
      )
    } else {
      validateUniqueItems()
    }

    fail(`!${valid}`)

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
      const wrongType = (Array.isArray(itemType) ? checkDataTypes : checkDataType)(
        itemType,
        "item",
        opts.strictNumbers,
        true
      )
      const indices = gen.name("indices")
      gen.code(`const ${indices} = {};`)
      gen.for(`;${i}--;`, () => {
        gen.code(`let item = ${data}[${i}];`)
        gen.if(wrongType, "continue")
        if (Array.isArray(itemType)) gen.if('typeof item == "string"', 'item += "_"')
        gen
          .if(
            `typeof ${indices}[item] == "number"`,
            `${valid} = false; ${j} = ${indices}[item]; break;`
          )
          .code(`${indices}[item] = ${i};`)
      })
    }

    function loopN2(): void {
      gen
        .code(`outer:`)
        .for(`;${i}--;`, () =>
          gen.for(`${j} = ${i}; ${j}--;`, () =>
            gen.if(`equal(${data}[${i}], ${data}[${j}])`, `${valid} = false; break outer;`)
          )
        )
    }
  },
  error: {
    message: ({$data, params: {i, j}}) => {
      const msg = `"should NOT have duplicate items (items ## " + ${j} + " and " + ${i} + " are identical)"`
      return $data ? `(${i} === undefined ? "uniqueItems must be boolean ($data)" : ${msg})` : msg
    },
    params: ({$data, params: {i, j}}) => {
      const obj = `{i: ${i}, j: ${j}}`
      return $data ? `(${i} === undefined ? {} : ${obj})` : obj
    },
  },
}

module.exports = def
