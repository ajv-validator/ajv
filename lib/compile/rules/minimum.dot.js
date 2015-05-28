function (data, dataType, dataPath) {
  'use strict';

  {{ var $exclusive = it.parentSchema.exclusiveMinimum === true; }}
  {{ var $op = $exclusive ? '>' : '>='; }}
  var valid = data {{= $op }} {{= it.schema }};
  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'minimum',
      schema: {{= it.schema }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should be {{= $op }} {{= it.schema }}'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
