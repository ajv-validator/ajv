import type {CodeKeywordDefinition, ErrorObject, KeywordErrorDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {_, or, Name, Code} from "../../compile/codegen"
import * as equal from "fast-deep-equal"

export type EnumError = ErrorObject<"enum", {allowedValues: any[]}, any[] | {$data: string}>

const error: KeywordErrorDefinition = {
  message: "should be equal to one of the allowed values",
  params: ({schemaCode}) => _`{allowedValues: ${schemaCode}}`,
}

const def: CodeKeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  error,
  code(cxt: KeywordCxt) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    if (!$data && schema.length === 0) throw new Error("enum must have non-empty array")
    const useLoop = schema.length >= it.opts.loopEnum
    const eql = cxt.gen.scopeValue("func", {
      ref: equal,
      code: _`require("ajv/dist/compile/equal")`,
    })
    let valid: Code
    if (useLoop || $data) {
      valid = gen.let("valid")
      cxt.block$data(valid, loopEnum)
    } else {
      /* istanbul ignore if */
      if (!Array.isArray(schema)) throw new Error("ajv implementation error")
      const vSchema = gen.const("vSchema", schemaCode)
      valid = or(...schema.map((_x: unknown, i: number) => equalCode(vSchema, i)))
    }
    cxt.pass(valid)

    function loopEnum(): void {
      gen.assign(valid, false)
      gen.forOf("v", schemaCode as Code, (v) =>
        gen.if(_`${eql}(${data}, ${v})`, () => gen.assign(valid, true).break())
      )
    }

    function equalCode(vSchema: Name, i: number): Code {
      const sch = schema[i]
      return sch && typeof sch === "object"
        ? _`${eql}(${data}, ${vSchema}[${i}])`
        : _`${data} === ${sch}`
    }
  },
}

export default def
