import type {TypeError} from "../compile/validate/dataType"
import type {ApplicatorKeywordError} from "./applicator"
import type {ValidationKeywordError} from "./validation"
import type {FormatError} from "./format/format"
import type {UnevaluatedPropertiesError} from "./applicator/unevaluatedProperties"

export type DefinedError =
  | TypeError
  | ApplicatorKeywordError
  | ValidationKeywordError
  | FormatError
  | UnevaluatedPropertiesError
