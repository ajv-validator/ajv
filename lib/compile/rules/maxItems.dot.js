function (data, dataType, dataPath) {
  'use strict';

  var valid = data.length <= {{= it.schema }};

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'maxItems',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should NOT have more than {{= it.schema }} items'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
