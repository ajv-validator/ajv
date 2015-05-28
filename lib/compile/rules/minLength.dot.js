function (data, dataType, dataPath) {
  'use strict';

  var valid = data.length >= {{= it.schema }};

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'minLength',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should NOT be shorter than {{= it.schema }} characters'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
