'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('issue #342, support uniqueItems with some non-JSON objects', function() {
  var validate;

  before(function() {
    var ajv = new Ajv;
    validate = ajv.compile({ uniqueItems: true });
  });

  it('should allow different RegExps', function() {
    validate([/foo/, /bar/]) .should.equal(true);
    validate([/foo/ig, /foo/gi]) .should.equal(false);
    validate([/foo/, {}]) .should.equal(true);
  });

  it('should allow different Dates', function() {
    validate([new Date('2016-11-11'), new Date('2016-11-12')]) .should.equal(true);
    validate([new Date('2016-11-11'), new Date('2016-11-11')]) .should.equal(false);
    validate([new Date('2016-11-11'), {}]) .should.equal(true);
  });

  it('should allow undefined properties', function() {
    validate([{}, {foo: undefined}]) .should.equal(true);
    validate([{foo: undefined}, {}]) .should.equal(true);
    validate([{foo: undefined}, {bar: undefined}]) .should.equal(true);
    validate([{foo: undefined}, {foo: undefined}]) .should.equal(false);
  });
});
