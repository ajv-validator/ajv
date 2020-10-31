import type {Vocabulary} from "../types"
import unevaluatedProperties from "./applicator/unevaluatedProperties"
import unevaluatedItems from "./applicator/unevaluatedItems"

const unevaluated: Vocabulary = [unevaluatedProperties, unevaluatedItems]

export default unevaluated
