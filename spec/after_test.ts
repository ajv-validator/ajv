const should = require("./chai").should()

module.exports = {
  error: afterError,
  each: afterEach,
}

export function afterError(res): void {
  console.log("ajv options:", res.validator._opts)
}

export function afterEach(res): void {
  // console.log(res.errors);
  res.valid.should.be.a("boolean")
  if (res.valid === true) {
    should.equal(res.errors, null)
  } else {
    res.errors.should.be.an("array")
    for (let i = 0; i < res.errors.length; i++) {
      res.errors[i].should.be.an("object")
    }
  }
}
