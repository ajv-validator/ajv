{{ /**
    * schema compilation (render) time:
    * it = { schema, RULES, _validate, opts }
    * it._validate - this template function
    *
    * runtime:
    * RULES, copy are defined in the parent scope in index.js
    */ }}

function (data, dataType, dataPath) {
  'use strict';

  {{? it.opts.allErrors }}
    var errors = [];
  {{?}}

  {{ var $schemaKeys = Object.keys(it.schema); }}
  {{ /* sort keys so that those that are easier to fail (e.g. type) are validated sooner */ }}

  {{
    var $checkProperties = !it.schema.properties && 
                              ( it.schema.patternProperties ||
                                it.schema.hasOwnProperty('additionalProperties') );
    if ($checkProperties) $schemaKeys.push('properties');
  }}

  {{~ $schemaKeys:$key }}
    {{ var $rule = it.RULES[$key]; }}
    {{? $rule }}
      var rule = RULES.{{=$key}};

      /* check if rule applies to data type */
      if ( !rule.type || rule.type == dataType ) {
        {{ 
          var $it = it.copy(it);
          $it.schema = it.schema[$key];
          $it.schemaPath = it.schemaPath + '.' + $key;
          $it.parentSchema = it.schema;
          $it.parentSchemaPath = it.schemaPath;
        }}
        var result = ({{= $rule.code($it) }})(data, dataType, dataPath);

        if (!result.valid) {
          {{? it.opts.allErrors }}
            errors.push.apply(errors, result.errors);
          {{??}}
            return result;
          {{?}}
        }
      }
    {{?}}
  {{~}}

  {{? it.opts.allErrors }}
    return { valid: !errors.length, errors: errors };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
