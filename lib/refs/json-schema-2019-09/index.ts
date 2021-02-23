import type Ajv from "../../core"
import type {AnySchemaObject} from "../../types"
import * as metaSchema from "./schema.json"
import * as metaApplicator from "./meta/applicator.json"
import * as metaContent from "./meta/content.json"
import * as metaCore from "./meta/core.json"
import * as metaFormat from "./meta/format.json"
import * as metaMetadata from "./meta/meta-data.json"
import * as metaValidation from "./meta/validation.json"

const META_SUPPORT_DATA = ["/properties"]

export default function addMetaSchema2019(this: Ajv, $data?: boolean): Ajv {
  ;[
    metaSchema,
    metaApplicator,
    metaContent,
    metaCore,
    with$data(this, metaFormat),
    metaMetadata,
    with$data(this, metaValidation),
  ].forEach((sch) => this.addMetaSchema(sch, undefined, false))
  return this

  function with$data(ajv: Ajv, sch: AnySchemaObject): AnySchemaObject {
    return $data ? ajv.$dataMetaSchema(sch, META_SUPPORT_DATA) : sch
  }
}
