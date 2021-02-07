import type {CodeKeywordDefinition} from "../../types"
import type KeywordCxt from "../../compile/context"
import {propertyInData, allSchemaProperties} from "../code"
import {alwaysValidSchema, schemaRefOrVal} from "../../compile/util"
import {_, and, Code, Name} from "../../compile/codegen"
import {checkMetadata} from "./metadata"
import {checkNullableObject} from "./nullable"

const def: CodeKeywordDefinition = {
  keyword: "properties",
  schemaType: "object",
  code: validateProperties,
}

export function validateProperties(cxt: KeywordCxt): void {
  checkMetadata(cxt)
  const {gen, data, parentSchema, it} = cxt
  const {additionalProperties, nullable} = parentSchema
  if (it.jtdDiscriminator && nullable) throw new Error("JTD: nullable inside discriminator mapping")
  if (commonProperties()) {
    throw new Error("JTD: properties and optionalProperties have common members")
  }
  const [allProps, properties] = schemaProperties("properties")
  const [allOptProps, optProperties] = schemaProperties("optionalProperties")
  if (properties.length === 0 && optProperties.length === 0 && additionalProperties) {
    return
  }

  const [valid, cond] =
    it.jtdDiscriminator === undefined
      ? checkNullableObject(cxt, data)
      : [gen.let("valid", false), true]
  gen.if(cond, () =>
    gen.assign(valid, true).block(() => {
      validateProps(properties, "properties", true)
      validateProps(optProperties, "optionalProperties")
      if (!additionalProperties) validateAdditional()
    })
  )
  cxt.pass(valid)

  function commonProperties(): boolean {
    const props = parentSchema.properties as Record<string, any> | undefined
    const optProps = parentSchema.optionalProperties as Record<string, any> | undefined
    if (!(props && optProps)) return false
    for (const p in props) {
      if (Object.prototype.hasOwnProperty.call(optProps, p)) return true
    }
    return false
  }

  function schemaProperties(keyword: string): [string[], string[]] {
    const schema = parentSchema[keyword]
    const allPs = schema ? allSchemaProperties(schema) : []
    if (it.jtdDiscriminator && allPs.some((p) => p === it.jtdDiscriminator)) {
      throw new Error(`JTD: discriminator tag used in ${keyword}`)
    }
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
      },
      _valid
    )
    return _valid
  }

  function validateAdditional(): void {
    gen.forIn("key", data, (key: Name) => {
      const _allProps =
        it.jtdDiscriminator === undefined ? allProps : [it.jtdDiscriminator].concat(allProps)
      const addProp = isAdditional(key, _allProps, "properties")
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
      const hasProp = gen.scopeValue("func", {
        // eslint-disable-next-line @typescript-eslint/unbound-method
        ref: Object.prototype.hasOwnProperty,
        code: _`Object.prototype.hasOwnProperty`,
      })
      additional = _`!${hasProp}.call(${propsSchema}, ${key})`
    } else if (props.length) {
      additional = and(...props.map((p) => _`${key} !== ${p}`))
    } else {
      additional = true
    }
    return additional
  }
}

export default def
