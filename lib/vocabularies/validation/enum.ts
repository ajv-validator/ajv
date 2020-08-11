import {KeywordDefinition} from "../../types"
import {quotedString} from "../util"

const def: KeywordDefinition = {
  keyword: "enum",
  schemaType: "array",
  $data: true,
  code({write, fail, scope, data, $data, schema, schemaCode, opts}) {
    if ($data) {
      const valid = scope.getName("valid")
      write(`let ${valid};`)
      // TODO trim whitespace
      write(
        `if (${schemaCode} === undefined) ${valid} = true;
        else {
          ${valid} = false;
          if (Array.isArray(${schemaCode})) {`
      )
      loopEnum(<string>schemaCode, valid)
      write("}}")
      fail(`!${valid}`)
    } else {
      if (schema.length === 0) throw new Error("enum must have non-empty array")
      const vSchema = scope.getName("schema")
      write(`const ${vSchema} = ${schemaCode};`)
      if (schema.length > (opts.loopEnum as number)) {
        const valid = scope.getName("valid")
        write(`let ${valid} = false;`)
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
      write(
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
    message: () => '"should be equal to one of the allowed values"',
    params: ({schemaCode}) => `{allowedValues: ${schemaCode}}`,
  },
}

module.exports = def
