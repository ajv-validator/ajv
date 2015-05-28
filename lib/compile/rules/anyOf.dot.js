function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var result = ({{= it._validate($it) }})(data, dataType, dataPath);

    if (result.valid) {
      return { valid: true, errors: [] };
    } else {
      errors.push.apply(errors, result.errors);
    }
  {{~}}

  return { valid: false, errors: errors };
}
