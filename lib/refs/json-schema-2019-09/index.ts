import type Ajv from "../../core"
import type {AnySchemaObject} from "../../types"
import metaSchema = require("./schema.json")
import metaApplicator = require("./meta/applicator.json")
import metaContent = require("./meta/content.json")
import metaCore = require("./meta/core.json")
import metaFormat = require("./meta/format.json")
import metaMetadata = require("./meta/meta-data.json")
import metaValidation = require("./meta/validation.json")

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
