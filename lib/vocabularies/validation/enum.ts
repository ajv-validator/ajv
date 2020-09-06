import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {_, or, Name, Code} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  code(cxt: KeywordCtx) {
    const {gen, data, $data, schema, schemaCode, it} = cxt
    if (!$data && schema.length === 0) throw new Error("enum must have non-empty array")
    const useLoop = typeof it.opts.loopEnum == "number" && schema.length >= it.opts.loopEnum
    let valid: Code
    if (useLoop || $data) {
      valid = gen.let("valid")
      cxt.block$data(valid, loopEnum)
    } else {
      const vSchema = gen.const("schema", schemaCode)
      valid = or(...schema.map((_x: any, i: number) => equalCode(vSchema, i)))
    }
    cxt.pass(valid)

    function loopEnum(): void {
      gen.assign(valid, false)
      gen.forOf("v", schemaCode, (v) =>
        gen.if(_`equal(${data}, ${v})`, () => gen.assign(valid, true).break())
      )
    }

    function equalCode(vSchema: Name, i: number): Code {
      const sch: string = schema[i]
      if (sch && typeof sch === "object") {
        return _`equal(${data}, ${vSchema}[${i}])`
      }
      return _`${data} === ${sch}`
    }
  },
  error: {
    message: "should be equal to one of the allowed values",
    params: ({schemaCode}) => _`{allowedValues: ${schemaCode}}`,
  },
}

module.exports = def
