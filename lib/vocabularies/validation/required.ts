import {CodeKeywordDefinition} from "../../types"
import KeywordCtx from "../../compile/context"
import {propertyInData, noPropertyInData} from "../util"
import {checkReportMissingProp, checkMissingProp, reportMissingProp} from "../missing"
import {_, str, nil, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "required",
  type: "object",
  schemaType: "array",
  $data: true,
  code(cxt: KeywordCtx) {
    const {gen, schema, schemaCode, data, $data, it} = cxt
    if (!$data && schema.length === 0) return
    const useLoop = typeof it.opts.loopRequired == "number" && schema.length >= it.opts.loopRequired
    if (it.allErrors) allErrorsMode()
    else exitOnErrorMode()

    function allErrorsMode(): void {
      if (useLoop || $data) {
        cxt.block$data(nil, loopAllRequired)
      } else {
        for (const prop of schema) {
          checkReportMissingProp(cxt, prop)
        }
      }
    }

    function exitOnErrorMode(): void {
      const missing = gen.let("missing")
      if (useLoop || $data) {
        const valid = gen.let("valid", true)
        cxt.block$data(valid, () => loopUntilMissing(missing, valid))
        cxt.ok(valid)
      } else {
        gen.if(checkMissingProp(cxt, schema, missing))
        reportMissingProp(cxt, missing)
        gen.else()
      }
    }

    function loopAllRequired(): void {
      gen.forOf("prop", schemaCode, (prop) => {
        cxt.setParams({missingProperty: prop})
        gen.if(noPropertyInData(data, prop, it.opts.ownProperties), () => cxt.error())
      })
    }

    function loopUntilMissing(missing: Name, valid: Name): void {
      cxt.setParams({missingProperty: missing})
      gen.forOf(
        missing,
        schemaCode,
        () => {
          gen.assign(valid, propertyInData(data, missing, it.opts.ownProperties))
          gen.ifNot(valid, () => {
            cxt.error()
            gen.break()
          })
        },
        nil
      )
    }
  },
  error: {
    message: ({params: {missingProperty}}) =>
      str`should have required property '${missingProperty}'`,
    params: ({params: {missingProperty}}) => _`{missingProperty: ${missingProperty}}`,
  },
}

module.exports = def
