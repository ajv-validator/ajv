import type {Vocabulary} from "../types"
import coreVocabulary from "./core"
import validationVocabulary from "./validation"
import applicatorVocabulary from "./applicator"
import formatVocabulary from "./format"
import {metadataVocabulary, contentVocabulary} from "./metadata"

const draft7Vocabularies: Vocabulary[] = [
  coreVocabulary,
  validationVocabulary,
  applicatorVocabulary,
  formatVocabulary,
  metadataVocabulary,
  contentVocabulary,
]

export default draft7Vocabularies
