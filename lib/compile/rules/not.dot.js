function (data, dataType, dataPath) {
  'use strict';

  var result = ({{= it._validate(it) }})(data, dataType, dataPath);
  result.valid = !result.valid;
  result.errors = result.valid ? [] : [{
    keyword: 'not',
    schema: self.schema{{= it.schemaPath }},
    dataPath: dataPath,
    message: 'data' + dataPath + ' is valid according to schema, should be NOT valid'
    {{? it.opts.verbose }}, data: data{{?}}
  }];
  return result;
}
