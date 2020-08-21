import {KeywordDefinition, KeywordErrorDefinition} from "../../types"
import {propertyInData, noPropertyInData} from "../util"
import {Expr} from "../../compile/subschema"
import {checkReportMissingProp, checkMissingProp, reportMissingProp} from "../missing"
import {reportError} from "../../compile/errors"

const error: KeywordErrorDefinition = {
  message: ({params: {missingProperty}}) => {
    return missingProperty
      ? `"should have required property '" + ${missingProperty} + "'"` // TODO missingProperty can be string constant
      : `'"required" keyword value must be array'`
  },
  params: ({params: {missingProperty}}) =>
    missingProperty ? `{missingProperty: ${missingProperty}}` : "{}",
}

const def: KeywordDefinition = {
  keyword: "required",
  type: "object",
  schemaType: ["array"],
  $data: true,
  code(cxt) {
    const {gen, ok, fail, errorParams, schema, schemaCode, data, $data, it} = cxt
    if (!$data && schema.length === 0) {
      ok()
      return
    }

    const loopRequired = $data || schema.length >= <number>it.opts.loopRequired

    if (it.allErrors) allErrorsMode()
    else exitOnErrorMode()

    function allErrorsMode(): void {
      if (loopRequired) {
        if ($data) {
          gen.if(`${schemaCode} && !Array.isArray(${schemaCode})`)
          reportError(cxt, error)
          gen.elseIf(`${schemaCode} !== undefined`)
          loopAllRequired()
          gen.endIf()
        } else {
          loopAllRequired()
        }
      } else {
        for (const prop of schema) {
          checkReportMissingProp(cxt, prop, error)
        }
      }
    }

    function exitOnErrorMode(): void {
      const missing = gen.name("missing")
      gen.code(`let ${missing};`)
      errorParams({missingProperty: missing})

      if (loopRequired) {
        const valid = gen.name("valid")
        gen.code(`let ${valid} = true;`)

        // TODO refactor and enable/fix test in errors.spec.js line 301
        // it can be simpler once blocks are globally supported - endIf can be removed, so there will be 2 open blocks
        if ($data) {
          gen
            .if(`${schemaCode} === undefined`)
            .code(`${valid} = true;`)
            .elseIf(`!Array.isArray(${schemaCode})`)
            .code(`${valid} = false;`)
            .else()
          loopUntilMissing(missing, valid)
          gen.endIf()
        } else {
          loopUntilMissing(missing, valid)
        }

        fail(`!${valid}`)
      } else {
        // TODO refactor ifs
        gen.code(`if (${checkMissingProp(cxt, schema, missing)}) {`)
        reportMissingProp(cxt, missing, error)
        gen.code(`} else {`)
      }
    }

    function loopAllRequired(): void {
      const prop = gen.name("prop")
      errorParams({missingProperty: prop})
      gen.for(`const ${prop} of ${schemaCode}`, () =>
        gen.if(noPropertyInData(data, prop, Expr.Str, it.opts.ownProperties), () =>
          reportError(cxt, error)
        )
      )
    }

    function loopUntilMissing(missing: string, valid: string): void {
      gen.for(`${missing} of ${schemaCode}`, () =>
        gen
          .code(`${valid} = ${propertyInData(data, missing, Expr.Str, it.opts.ownProperties)};`)
          .if(`!${valid}`, "break")
      )
    }
  },
  error,
}

module.exports = def
