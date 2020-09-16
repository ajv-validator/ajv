import type {ErrorObject} from "../types"
import type {RefErrorParams} from "./core/ref"
import type {TypeErrorParams} from "../compile/validate/dataType"
import type {AdditionalItemsErrorParams} from "./applicator/additionalItems"
import type {AdditionalPropsErrorParams} from "./applicator/additionalProperties"
import type {DependenciesErrorParams} from "./applicator/dependencies"
import type {IfErrorParams} from "./applicator/if"
import type {OneOfErrorParams} from "./applicator/oneOf"
import type {PropertyNamesErrorParams} from "./applicator/propertyNames"
import type {LimitErrorParams, LimitNumberErrorParams} from "./validation/limit"
import type {MultipleOfErrorParams} from "./validation/multipleOf"
import type {PatternErrorParams} from "./validation/pattern"
import type {RequiredErrorParams} from "./validation/required"
import type {UniqueItemsErrorParams} from "./validation/uniqueItems"
import type {ConstErrorParams} from "./validation/const"
import type {EnumErrorParams} from "./validation/enum"
import type {FormatErrorParams} from "./format/format"

type LimitKeyword =
  | "maxItems"
  | "minItems"
  | "minProperties"
  | "maxProperties"
  | "minLength"
  | "maxLength"

type LimitNumberKeyword = "maximum" | "minimum" | "exclusiveMaximum" | "exclusiveMinimum"

type RefError = ErrorObject<"ref", RefErrorParams>
type TypeError = ErrorObject<"type", TypeErrorParams>
type ErrorWithoutParams = ErrorObject<
  "anyOf" | "contains" | "not" | "false schema",
  Record<string, never>
>
type AdditionalItemsError = ErrorObject<"additionalItems", AdditionalItemsErrorParams>
type AdditionalPropsError = ErrorObject<"additionalProperties", AdditionalPropsErrorParams>
type DependenciesError = ErrorObject<"dependencies", DependenciesErrorParams>
type IfKeywordError = ErrorObject<"if", IfErrorParams>
type OneOfError = ErrorObject<"oneOf", OneOfErrorParams>
type PropertyNamesError = ErrorObject<"propertyNames", PropertyNamesErrorParams>
type LimitError = ErrorObject<LimitKeyword, LimitErrorParams>
type LimitNumberError = ErrorObject<LimitNumberKeyword, LimitNumberErrorParams>
type MultipleOfError = ErrorObject<"multipleOf", MultipleOfErrorParams>
type PatternError = ErrorObject<"pattern", PatternErrorParams>
type RequiredError = ErrorObject<"required", RequiredErrorParams>
type UniqueItemsError = ErrorObject<"uniqueItems", UniqueItemsErrorParams>
type ConstError = ErrorObject<"const", ConstErrorParams>
type EnumError = ErrorObject<"enum", EnumErrorParams>
type FormatError = ErrorObject<"format", FormatErrorParams>

export type DefinedError =
  | RefError
  | TypeError
  | ErrorWithoutParams
  | AdditionalItemsError
  | AdditionalPropsError
  | DependenciesError
  | IfKeywordError
  | OneOfError
  | PropertyNamesError
  | LimitNumberError
  | MultipleOfError
  | LimitError
  | PatternError
  | RequiredError
  | UniqueItemsError
  | ConstError
  | EnumError
  | FormatError
