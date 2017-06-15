'use strict';

var getAjvInstances = require('./ajv_instances');
  // , should = require('./chai').should();


describe.skip('$params', function() {
  var instances;

  beforeEach(function() {
    instances = getAjvInstances({allErrors: true}, {$params: true});
  });

  it('should compile schema with $params to higher order validation function', function() {
    var schema = {
      id: 'range',
      $params: {
        min: {type: 'number'},
        max: {type: 'number'}
      },
      type: 'number',
      minimum: {$param: '/min'},
      maximum: {$param: '/max'}
    };

    instances.forEach(function (ajv) {
      var getRangeValidate = ajv.compile(schema);
      var validate = getRangeValidate(0, 10);
      validate(0) .should.equal(true);
      validate(10) .should.equal(true);
      validate(10.5) .should.equal(false);
      validate(-0.6) .should.equal(false);
    });
  });
});
