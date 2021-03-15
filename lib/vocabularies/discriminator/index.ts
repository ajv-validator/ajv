import type {CodeKeywordDefinition, SchemaObject} from "../../types"
import type {KeywordCxt} from "../../compile/validate"
import {_, getProperty, Name} from "../../compile/codegen"

interface DiscriminatorSchema {
  propertyName: string
  mapping?: Record<string, string | undefined>
}

const metaSchema = {
  type: "object",
  properties: {
    propertyName: {type: "string"},
    mapping: {
      type: "object",
      additionalProperties: {type: "string"},
    },
  },
  required: ["propertyName"],
  additionalProperties: false,
}

const def: CodeKeywordDefinition = {
  keyword: "discriminator",
  type: "object",
  schemaType: "object",
  metaSchema,
  code(cxt: KeywordCxt) {
    const {gen, data, schema, parentSchema, it} = cxt
    const {oneOf} = parentSchema
    if (!it.opts.discriminator) {
      throw new Error("discriminator: requires discriminator option")
    }
    if (!oneOf) throw new Error("discriminator: requires oneOf")
    const valid = gen.let("valid", false)
    const tag = gen.const("tag", _`${data}${getProperty(schema.propertyName)}`)
    cxt.setParams({discrError: "tag", tag})
    const oneOfIndex = getOneOfMapping(schema)
    if (schema.mapping) {
      validateMapping()
    } else {
      validateDiscriminator()
    }
    cxt.ok(valid)

    function validateDiscriminator(): void {
      gen.if(
        _`typeof ${tag} == "string"`,
        () => validateMapping(),
        () => cxt.error()
      )
    }

    function validateMapping(): void {
      gen.if(false)
      for (const tagValue in oneOfIndex) {
        gen.elseIf(_`${tag} === ${tagValue}`)
        gen.assign(valid, applyTagSchema(oneOfIndex[tagValue]))
      }
      if (!schema.mapping) {
        gen.else()
        cxt.error()
      }
      gen.endIf()
    }

    function applyTagSchema(schemaProp?: number): Name {
      const _valid = gen.name("valid")
      const schCxt = cxt.subschema({keyword: "oneOf", schemaProp}, _valid)
      cxt.mergeEvaluated(schCxt, Name)
      return _valid
    }

    function getOneOfMapping({
      propertyName: tagName,
      mapping,
    }: DiscriminatorSchema): {[T in string]?: number} {
      const oneOfMapping: {[T in string]?: number} = {}
      const tagRequired = isRequired(parentSchema.required)
      if (mapping) {
        const refs: {[T in string]?: number} = {}
        for (let i = 0; i < oneOf.length; i++) {
          const ref = oneOf[i].$ref
          if (typeof ref != "string") {
            throw new Error(`discriminator: oneOf schemas must have "$ref"`)
          }
          refs[ref] = i
        }
        for (const tagValue in mapping) {
          checkUniqueTagValue(tagValue)
          const ref = mapping[tagValue] as string
          if (refs[ref] === undefined) {
            throw new Error(`discriminator: mapping has ref not in oneOf`)
          }
          oneOfMapping[tagValue] = refs[ref]
        }
        checkTagProperty()
      } else {
        let innerTagRequired = true
        for (let i = 0; i < oneOf.length; i++) {
          const sch = oneOf[i]
          const propSch = sch.properties?.[tagName]
          if (typeof propSch != "object") {
            throw new Error(`discriminator: oneOf schemas must have "properties/${tagName}"`)
          }
          innerTagRequired = innerTagRequired && (tagRequired || isRequired(sch.required))
          addMappings(propSch, i)
        }
        if (!innerTagRequired) throw new Error(`discriminator: "${tagName}" must be required`)
      }
      return oneOfMapping

      function isRequired(req: unknown): boolean {
        return Array.isArray(req) && req.includes(tagName)
      }

      function addMappings(sch: SchemaObject, i: number): void {
        if (sch.const) {
          addMapping(sch.const, i)
        } else if (sch.enum) {
          for (const tagValue of sch.enum) {
            addMapping(tagValue, i)
          }
        } else {
          throw new Error(`discriminator: "properties/${tagName}" must have "const" or "enum"`)
        }
      }

      function addMapping(tagValue: unknown, i: number): void {
        if (typeof tagValue != "string") {
          throw new Error(`discriminator: "${tagName}" property must be string`)
        }
        checkUniqueTagValue(tagValue)
        oneOfMapping[tagValue] = i
      }

      function checkUniqueTagValue(tagValue: string): void {
        if (tagValue in oneOfMapping) {
          throw new Error(`discriminator: duplicate "${tagName}" property value "${tagValue}"`)
        }
      }

      function checkTagProperty(): void {
        const values = parentSchema.properties?.[tagName]?.enum
        if (Array.isArray(values)) {
          const tagValues = new Set(values)
          const mappingValues = Object.keys(oneOfMapping)
          if (
            tagValues.size === mappingValues.length &&
            mappingValues.every((v) => tagValues.has(v))
          ) {
            return
          }
        }
        throw new Error(`discriminator: "properties/${tagName}/enum" must match mapping`)
      }
    }
  },
}

export default def
