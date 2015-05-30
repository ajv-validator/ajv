function (data, dataType, dataPath) {
  'use strict';

  var result = ({{= it.validate(it) }})(data, dataType, dataPath);
  result.valid = !result.valid;
  result.errors = result.valid ? [] : [{
    keyword: 'not',
    schema: validate.schema{{= it.schemaPath }},
    dataPath: dataPath,
    message: 'should NOT be valid'
    {{? it.opts.verbose }}, data: data{{?}}
  }];
  return result;
}
