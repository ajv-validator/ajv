import type {RefError} from "./core/ref"
import type {TypeError} from "../compile/validate/dataType"
import type {ApplicatorKeywordError} from "./applicator"
import type {ValidationKeywordError} from "./validation"
import type {FormatError} from "./format/format"

export type DefinedError =
  | RefError
  | TypeError
  | ApplicatorKeywordError
  | ValidationKeywordError
  | FormatError
