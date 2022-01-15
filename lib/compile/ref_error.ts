import {resolveUrl, normalizeId, getFullPath} from "./resolve"
import type {UriResolver} from "../types"

export default class MissingRefError extends Error {
  readonly missingRef: string
  readonly missingSchema: string

  constructor(baseId: string, ref: string, resolver:UriResolver, msg?: string) {
    super(msg || `can't resolve reference ${ref} from id ${baseId}`)
    this.missingRef = resolveUrl(baseId, ref, resolver)
    this.missingSchema = normalizeId(getFullPath(this.missingRef, resolver))
  }
}
