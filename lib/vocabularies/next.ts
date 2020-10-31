import type {Vocabulary} from "../types"
import dependentRequired from "./applicator/dependentRequired"
import dependentSchemas from "./applicator/dependentSchemas"

const next: Vocabulary = [dependentRequired, dependentSchemas]

export default next
