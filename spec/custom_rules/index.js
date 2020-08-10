"use strict"

var fs = require("fs"),
  path = require("path"),
  doT = require("dot")

module.exports = {
  range: doT.compile(
    fs.readFileSync(path.join(__dirname, "range.jst"), "utf8")
  ),
  rangeWithErrors: doT.compile(
    fs.readFileSync(path.join(__dirname, "range_with_errors.jst"), "utf8")
  ),
}
