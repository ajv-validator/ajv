function (data, dataType, dataPath) {
  'use strict';

  {{ new RegExp(it.schema); /* test if regexp is valid to fail at compile time rather than in eval */}}
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
