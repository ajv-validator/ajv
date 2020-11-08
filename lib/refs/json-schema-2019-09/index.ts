import type Ajv from "../../ajv"
import type {SchemaObject} from "../../ajv"
import metaSchema from "./schema.json"
import metaApplicator from "./meta/applicator.json"
import metaContent from "./meta/content.json"
import metaCore from "./meta/core.json"
import metaFormat from "./meta/format.json"
import metaMetadata from "./meta/meta-data.json"
import metaValidation from "./meta/validation.json"

export default function addMetaSchema2019(ajv: Ajv, setDefault?: boolean): Ajv {
  ;[
    metaSchema,
    metaApplicator,
    metaContent,
    metaCore,
    metaFormat,
    metaMetadata,
    metaValidation,
  ].forEach(addMeta)
  if (setDefault) ajv.opts.defaultMeta = "https://json-schema.org/draft/2019-09/schema"
  return ajv

  function addMeta(sch: SchemaObject): void {
    ajv.addMetaSchema(sch, undefined, false)
  }
}
