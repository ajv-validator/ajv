import type Ajv from "../../ajv"
import type {SchemaObject} from "../../ajv"
import metaSchema from "./schema.json"
import applicatorMetaSchema from "./meta/applicator.json"
import contentMetaSchema from "./meta/content.json"
import coreMetaSchema from "./meta/core.json"
import formatMetaSchema from "./meta/format.json"
import metadataMetaSchema from "./meta/meta-data.json"
import validationMetaSchema from "./meta/validation.json"

export default function addMetaSchema2019(ajv: Ajv, setDefault?: boolean): Ajv {
  ;[
    metaSchema,
    applicatorMetaSchema,
    contentMetaSchema,
    coreMetaSchema,
    formatMetaSchema,
    metadataMetaSchema,
    validationMetaSchema,
  ].forEach(addMeta)
  if (setDefault) ajv.opts.defaultMeta = "https://json-schema.org/draft/2019-09/schema"
  return ajv

  function addMeta(sch: SchemaObject): void {
    ajv.addMetaSchema(sch, undefined, false)
  }
}
