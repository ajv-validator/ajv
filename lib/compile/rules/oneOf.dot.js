function (data, dataType, dataPath) {
  'use strict';

  var errors = [], foundValid = false;

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var result = ({{= it._validate($it) }})(data, dataType, dataPath);

    if (result.valid) {
      if (foundValid) return { valid: false, errors: [{
        keyword: 'oneOf',
        schema: self.schema{{= it.schemaPath }},
        dataPath: dataPath,
        message: 'should match exactly one schema in oneOf'
        {{? it.opts.verbose }}, data: data{{?}}
      }] };
      foundValid = true;
    } else
      errors.push.apply(errors, result.errors);
  {{~}}

  if (foundValid) errors = [];
  else errors.push({
    keyword: 'oneOf',
    schema: self.schema{{= it.schemaPath }},
    dataPath: dataPath,
    message: 'should match exactly one schema in oneOf'
    {{? it.opts.verbose }}, data: data{{?}}
  });

  return { valid: foundValid, errors: errors };
}
