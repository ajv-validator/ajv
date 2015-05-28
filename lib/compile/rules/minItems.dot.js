function (data, dataType, dataPath) {
  'use strict';

  var valid = data.length >= {{= it.schema }};

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'minItems',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should NOT have less than {{= it.schema }} items'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
