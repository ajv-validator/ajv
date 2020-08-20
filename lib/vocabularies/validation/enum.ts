import {KeywordDefinition} from "../../types"
import {quotedString} from "../util"

const def: KeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  code({gen, fail, data, $data, schema, schemaCode, it: {opts}}) {
    if ($data) {
      const valid = gen.name("valid")
      gen.code(`let ${valid};`)
      gen.if(
        `${schemaCode} === undefined`,
        () => gen.code(`${valid} = true;`),
        () =>
          gen
            .code(`${valid} = false;`)
            .if(`Array.isArray(${schemaCode})`, () => loopEnum(<string>schemaCode, valid))
      )
      fail(`!${valid}`)
    } else {
      if (schema.length === 0) throw new Error("enum must have non-empty array")
      const vSchema = gen.name("schema")
      gen.code(`const ${vSchema} = ${schemaCode};`)
      if (schema.length > (opts.loopEnum as number)) {
        const valid = gen.name("valid")
        gen.code(`let ${valid} = false;`)
        loopEnum(vSchema, valid)
        fail(`!${valid}`)
      } else {
        let cond: string = schema.reduce(
          (c, _, i) => (c += (c && "||") + equalCode(vSchema, i)),
          ""
        )
        fail(`!(${cond})`)
      }
    }

    function loopEnum(sch: string, valid: string): void {
      // TODO trim whitespace
      gen.code(
        `for (const v of ${sch}) {
          if (equal(${data}, v)) {
            ${valid} = true;
            break;
          }
        }`
      )
    }

    function equalCode(vSchema: string, i: number): string {
      let sch = schema[i]
      if (sch && typeof sch === "object") {
        return `equal(${data}, ${vSchema}[${i}])`
      }
      if (typeof sch === "string") sch = quotedString(sch)
      return `${data} === ${sch}`
    }
  },
  error: {
    message: "should be equal to one of the allowed values",
    params: ({schemaCode}) => `{allowedValues: ${schemaCode}}`,
  },
}

module.exports = def
