import type {Vocabulary} from "../types"
import dependentRequired from "./validation/dependentRequired"
import dependentSchemas from "./applicator/dependentSchemas"

const next: Vocabulary = [dependentRequired, dependentSchemas]

export default next
