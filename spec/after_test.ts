import type Ajv from ".."
import type {AnySchema, ErrorObject} from ".."
import chai from "./chai"
const should = chai.should()

interface TestResult {
  validator: Ajv
  schema: AnySchema
  data: unknown
  valid: boolean
  expected: boolean
  errors: ErrorObject[] | null
  passed: boolean // true if valid == expected
}

export function afterError(res: TestResult): void {
  console.log("ajv options:", res.validator.opts)
}

export function afterEach(res: TestResult): void {
  // console.log(res.errors);
  res.valid.should.be.a("boolean")
  if (res.valid === true) {
    should.equal(res.errors, null)
  } else {
    const errs = res.errors as ErrorObject[]
    errs.should.be.an("array")
    for (const err of errs) {
      err.should.be.an("object")
    }
  }
}
