function (data, dataType, dataPath) {
  'use strict';

  var valid = /{{= it.schema }}/.test(data);

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'minimum',
      schema: '{{= it.schema }}',
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should match pattern "{{= it.schema }}"'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
