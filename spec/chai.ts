import "chai"

const chai: Chai.ChaiStatic =
  typeof window == "object" ? (window as any).chai : require("" + "chai")

export default chai

module.exports = chai
