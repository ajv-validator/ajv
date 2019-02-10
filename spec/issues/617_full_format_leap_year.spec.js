'use strict';

var Ajv = require('../ajv');
require('../chai').should();


describe('PR #617, full date format validation should understand leap years', function () {
  it('should handle non leap year affected dates with date-time', function() {
    var ajv = new Ajv({ format: 'full' });

    var schema = { format: 'date-time' };
    var validDateTime = '2016-01-31T00:00:00Z';

    ajv.validate(schema, validDateTime).should.equal(true);
  });

  it('should handle non leap year affected dates with date', function () {
    var ajv = new Ajv({ format: 'full' });

    var schema = { format: 'date' };
    var validDate = '2016-11-30';

    ajv.validate(schema, validDate).should.equal(true);
  });

  it('should handle year leaps as date-time', function() {
    var ajv = new Ajv({ format: 'full' });

    var schema = { format: 'date-time' };
    var validDateTime = '2016-02-29T00:00:00Z';
    var invalidDateTime = '2017-02-29T00:00:00Z';

    ajv.validate(schema, validDateTime) .should.equal(true);
    ajv.validate(schema, invalidDateTime) .should.equal(false);
  });

  it('should handle year leaps as date', function() {
    var ajv = new Ajv({ format: 'full' });

    var schema = { format: 'date' };
    var validDate = '2016-02-29';
    var invalidDate = '2017-02-29';

    ajv.validate(schema, validDate) .should.equal(true);
    ajv.validate(schema, invalidDate) .should.equal(false);
  });
});
