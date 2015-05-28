function (data, dataType, dataPath) {
  'use strict';

  var valid = data.length <= {{= it.schema }};

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'maxLength',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should NOT be longer than {{= it.schema }} characters'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
