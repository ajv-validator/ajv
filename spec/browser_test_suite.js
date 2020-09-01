"use strict"

module.exports = function (suite) {
  suite.forEach((file) => {
    if (file.name.indexOf("optional/format") === 0) {
      file.name = file.name.replace("optional/", "")
    }
    file.test = file.module
  })
  return suite
}
