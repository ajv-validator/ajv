import {KeywordDefinition} from "../../types"
import {checkDataType, checkDataTypes} from "../../compile/util"

const def: KeywordDefinition = {
  keyword: "uniqueItems",
  type: "array",
  schemaType: "boolean",
  $data: true,
  code({write, fail, ok, errorParams, scope, data, $data, schema, parentSchema, schemaCode, opts}) {
    if (opts.uniqueItems === false || !($data || schema)) return ok()
    const i = scope.getName("i")
    const j = scope.getName("j")
    errorParams({i, j})
    const valid = scope.getName("valid")
    write(`let ${valid}, ${i}, ${j};`)
    if ($data) {
      write(
        `if (${schemaCode} === false || ${schemaCode} === undefined)
          ${valid} = true;
        else if (typeof ${schemaCode} != "boolean")
          ${valid} = false;
        else {`
      )
    }
    const itemType = parentSchema.items?.type
    write(
      `${i} = ${data}.length;
      ${valid} = true;
      if (${i} > 1) {
        ${canOptimize() ? loopN() : loopN2()}
      }`
    )
    if ($data) write("}")
    fail(`!${valid}`)

    function canOptimize(): boolean {
      return Array.isArray(itemType)
        ? !itemType.some((t) => t === "object" || t === "array")
        : itemType && itemType !== "object" && itemType !== "array"
    }

    function loopN(): string {
      const wrongType = (Array.isArray(itemType) ? checkDataTypes : checkDataType)(
        itemType,
        "item",
        opts.strictNumbers,
        true
      )
      const indices = scope.getName("indices")
      return `const ${indices} = {};
        for (;${i}--;) {
          let item = ${data}[${i}];
          if (${wrongType}) continue;
          ${Array.isArray(itemType) ? 'if (typeof item == "string") item += "_";' : ""}
          if (typeof ${indices}[item] == "number") {
            ${valid} = false;
            ${j} = ${indices}[item];
            break;
          }
          ${indices}[item] = ${i};
        }`
    }

    function loopN2(): string {
      return `outer:
        for (;${i}--;) {
          for (${j} = ${i}; ${j}--;) {
            if (equal(${data}[${i}], ${data}[${j}])) {
              ${valid} = false;
              break outer;
            }
          }
        }`
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
