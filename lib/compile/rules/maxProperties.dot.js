function (data, dataType, dataPath) {
  'use strict';

  var propertiesNum = Object.keys(data).length;
  var valid = propertiesNum <= {{= it.schema }};

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'maxProperties',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should NOT have more than {{= it.schema }} properties'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
