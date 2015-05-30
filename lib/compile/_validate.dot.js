{{ /**
    * schema compilation (render) time:
    * it = { schema, RULES, _validate, opts }
    * it._validate - this template function
    *
    * runtime:
    * RULES, copy are defined in the parent scope in index.js
    */ }}

{{
  function compareRules(key1, key2) {
    var rule1 = it.RULES[key1]
      , rule2 = it.RULES[key2]
      , order1 = rule1 && rule1.order || 0
      , order2 = rule2 && rule2.order || 0;
    if (order1 < order2) return -1;
    if (order1 > order2) return +1;
    if (order1 == order2) return 0;
  }
}}


function (data, dataType, dataPath) {
  'use strict';

  {{? it.opts.allErrors }}
    var errors = [];
  {{?}}

  {{
    var $schemaKeys = Object.keys(it.schema);
    $schemaKeys.sort(compareRules);
  }}

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
        {{? $rule.inline}}
          {{= $rule.code(it) }}
        {{??}}
          {{
            var $it = it.copy(it);
            $it.schema = it.schema[$key];
            $it.schemaPath = it.schemaPath + '.' + $key;
            $it.parentSchema = it.schema;
            $it.parentSchemaPath = it.schemaPath;
          }}
          var result = ({{= $rule.code($it) }})(data, dataType, dataPath);
        {{?}}

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
