function (data, dataType, dataPath) {
  'use strict';

  {{? it.opts.allErrors }} var errs = validate.errors.length; {{?}}

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    {{? !it.opts.allErrors }} var valid = {{?}}
      ({{= it.validate($it) }})(data, dataType, dataPath);

    {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
  {{~}}

  return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
}
