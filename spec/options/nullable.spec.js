'use strict';

var Ajv = require('../ajv');
var should = require('../chai').should();


describe('nullable option', function() {
  var ajv;

  describe('= true', function() {
    beforeEach(function () {
      ajv = new Ajv({
        nullable: true
      });
    });

    it('should add keyword "nullable"', function() {
      testNullable({
        type: 'number',
        nullable: true
      });

      testNullable({
        type: ['number'],
        nullable: true
      });

      testNullable({
        type: ['number', 'null']
      });

      testNullable({
        type: ['number', 'null'],
        nullable: true
      });

      testNotNullable({type: 'number'});

      testNotNullable({type: ['number']});
    });

    it('should respect "nullable" == false with opts.nullable == true', function() {
      testNotNullable({
        type: 'number',
        nullable: false
      });

      testNotNullable({
        type: ['number'],
        nullable: false
      });
    });
  });

  describe('without option "nullable"', function() {
    it('should ignore keyword nullable', function() {
      ajv = new Ajv;

      testNotNullable({
        type: 'number',
        nullable: true
      });

      testNotNullable({
        type: ['number'],
        nullable: true
      });

      testNullable({
        type: ['number', 'null'],
      });

      testNullable({
        type: ['number', 'null'],
        nullable: true
      });

      should.not.throw(function () {
        ajv.compile({nullable: false});
      });
    });
  });

  function testNullable(schema) {
    var validate = ajv.compile(schema);
    validate(1) .should.equal(true);
    validate(null) .should.equal(true);
    validate('1') .should.equal(false);
  }

  function testNotNullable(schema) {
    var validate = ajv.compile(schema);
    validate(1) .should.equal(true);
    validate(null) .should.equal(false);
    validate('1') .should.equal(false);
  }
});
