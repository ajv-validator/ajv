'use strict';

var should = require('./chai').should();

exports.error = function (res) {
  console.log('ajv options:', res.validator._opts);
};

exports.each = function (res) {
  // console.log(res.errors);
  res.valid .should.be.a('boolean');
  if (res.valid === true ) {
    should.equal(res.errors, null);
  } else {
    res.errors .should.be.an('array');
    for (var i=0; i<res.errors.length; i++)
      res.errors[i] .should.be.an('object');
  }
};
