import type {TypeError} from "../compile/validate/dataType"
import type {ApplicatorKeywordError} from "./applicator"
import type {ValidationKeywordError} from "./validation"
import type {FormatError} from "./format/format"
import type {UnevaluatedPropertiesError} from "./applicator/unevaluatedProperties"
import type {UnevaluatedItemsError} from "./applicator/unevaluatedItems"
import type {DependentRequiredError} from "./validation/dependentRequired"

export type DefinedError =
  | TypeError
  | ApplicatorKeywordError
  | ValidationKeywordError
  | FormatError
  | UnevaluatedPropertiesError
  | UnevaluatedItemsError
  | DependentRequiredError
