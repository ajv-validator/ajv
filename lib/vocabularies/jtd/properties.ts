import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {propertyInData, allSchemaProperties} from "../code"
import {alwaysValidSchema, schemaRefOrVal} from "../../compile/util"
import {_, not, and, Code, Name} from "../../compile/codegen"

const def: CodeKeywordDefinition = {
  keyword: "properties",
  schemaType: "object",
  code: validateProperties,
}

export function validateProperties(cxt: KeywordCxt): void {
  const {gen, data, parentSchema, it} = cxt
  const {additionalProperties} = parentSchema
  let cond: Code
  const [allProps, properties] = schemaProperties("properties")
  const [allOptProps, optProperties] = schemaProperties("optionalProperties")
  if (properties.length === 0 && optProperties.length === 0 && additionalProperties) {
    return
  }

  const valid = gen.name("valid")
  if (parentSchema.nullable) {
    gen.let(valid, _`${data} === null`)
    cond = not(valid)
  } else {
    gen.let(valid, false)
    cond = data
  }

  gen.if(_`${cond} && typeof ${data} == "object" && !Array.isArray(${data})`, () => {
    gen.assign(valid, true)
    gen.block(() => {
      validateProps(properties, "properties", true)
      validateProps(optProperties, "optionalProperties")
      if (!additionalProperties) validateAdditional()
    })
  })
  cxt.pass(valid)

  function schemaProperties(keyword: string): [string[], string[]] {
    const schema = parentSchema[keyword]
    const allPs = schema ? allSchemaProperties(schema) : []
    const ps = allPs.filter((p) => !alwaysValidSchema(it, schema[p]))
    return [allPs, ps]
  }

  function validateProps(props: string[], keyword: string, required?: boolean): void {
    for (const prop of props) {
      gen.if(
        propertyInData(data, prop, it.opts.ownProperties),
        () => gen.assign(valid, and(valid, applyPropertySchema(prop, keyword))),
        required ? () => gen.assign(valid, false) : undefined
      )
      cxt.ok(valid)
    }
  }

  function applyPropertySchema(prop: string, keyword: string): Name {
    const _valid = gen.name("valid")
    cxt.subschema(
      {
        keyword,
        schemaProp: prop,
        dataProp: prop,
        strictSchema: it.strictSchema,
      },
      _valid
    )
    return _valid
  }

  function validateAdditional(): void {
    gen.forIn("key", data, (key: Name) => {
      const addProp = isAdditional(key, allProps, "properties")
      const addOptProp = isAdditional(key, allOptProps, "optionalProperties")
      const extra =
        addProp === true ? addOptProp : addOptProp === true ? addProp : and(addProp, addOptProp)
      gen.if(extra, () => {
        if (it.opts.removeAdditional) gen.code(_`delete ${data}[${key}]`)
        // cxt.setParams({additionalProperty: key})
        cxt.error()
        gen.assign(valid, false)
        if (!it.opts.allErrors) gen.break()
      })
    })
  }

  function isAdditional(key: Name, props: string[], keyword: string): Code | true {
    let additional: Code | boolean
    if (props.length > 8) {
      // TODO maybe an option instead of hard-coded 8?
      const propsSchema = schemaRefOrVal(it, parentSchema[keyword], keyword)
      additional = _`!${propsSchema}.hasOwnProperty(${key})`
    } else if (props.length) {
      additional = and(...props.map((p) => _`${key} !== ${p}`))
    } else {
      additional = true
    }
    return additional
  }
}

export default def
