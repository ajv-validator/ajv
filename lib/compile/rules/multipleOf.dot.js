function (data, dataType, dataPath) {
  'use strict';

  var division = data / {{= it.schema }};
  var valid = division === parseInt(division);
  
  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'multipleOf',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should be multiple of {{= it.schema }}'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
