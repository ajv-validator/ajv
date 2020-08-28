import {CodeKeywordDefinition} from "../../types"
import KeywordContext from "../../compile/context"
import {propertyInData, noPropertyInData} from "../util"
import {checkReportMissingProp, checkMissingProp, reportMissingProp} from "../missing"
import {_, str, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "required",
  type: "object",
  schemaType: ["array"],
  $data: true,
  code(cxt: KeywordContext) {
    const {gen, schema, schemaCode, data, $data, it} = cxt
    if (!$data && schema.length === 0) return

    const loopRequired = $data || schema.length >= <number>it.opts.loopRequired

    if (it.allErrors) allErrorsMode()
    else exitOnErrorMode()

    function allErrorsMode(): void {
      if (loopRequired) {
        if ($data) {
          gen.if(
            `${schemaCode} && !Array.isArray(${schemaCode})`,
            () => cxt.error(),
            () => gen.if(`${schemaCode} !== undefined`, loopAllRequired)
          )
        } else {
          loopAllRequired()
        }
      } else {
        for (const prop of schema) {
          checkReportMissingProp(cxt, prop)
        }
      }
    }

    function exitOnErrorMode(): void {
      const missing = gen.let("missing")
      cxt.setParams({missingProperty: missing})

      if (loopRequired) {
        const valid = gen.let("valid", true)

        // TODO refactor and enable/fix test in errors.spec.js line 301
        // it can be simpler once blocks are globally supported - endIf can be removed, so there will be 2 open blocks
        if ($data) {
          gen.if(`${schemaCode} === undefined`, `${valid} = true`, () =>
            gen.if(`!Array.isArray(${schemaCode})`, `${valid} = false`, () =>
              loopUntilMissing(missing, valid)
            )
          )
        } else {
          loopUntilMissing(missing, valid)
        }

        cxt.pass(valid)
      } else {
        gen.if(`${checkMissingProp(cxt, schema, missing)}`)
        reportMissingProp(cxt, missing)
        gen.else()
      }
    }

    function loopAllRequired(): void {
      const prop = gen.name("prop")
      cxt.setParams({missingProperty: prop})
      gen.for(`const ${prop} of ${schemaCode}`, () =>
        gen.if(noPropertyInData(data, prop, it.opts.ownProperties), () => cxt.error())
      )
    }

    function loopUntilMissing(missing: Name, valid: Name): void {
      gen.for(`${missing} of ${schemaCode}`, () =>
        gen
          .assign(valid, propertyInData(data, missing, it.opts.ownProperties))
          .ifNot(valid, "break")
      )
    }
  },
  error: {
    message: ({params: {missingProperty}}) => {
      return missingProperty
        ? str`should have required property '${missingProperty}'`
        : str`"required" keyword value must be array`
    },
    params: ({params: {missingProperty}}) =>
      missingProperty ? _`{missingProperty: ${missingProperty}}` : _`{}`,
  },
}

module.exports = def
