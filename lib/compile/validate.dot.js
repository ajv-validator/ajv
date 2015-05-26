'use strict';

validate = function(data) {
  var types = [], errors = [], valid, error;

  {{ var $paths = []; /* do I need it? */ }}
  {{ var $opts = this.opts; }}

  {{  (function $generateValidator($schema) {  }}

    var dataType = typeof data;
    if (dataType == 'object') {
        if (Array.isArray(data)) dataType = 'array';
        else if (data == null) dataType = 'null';
    }
    types.push(dataType);

    {{ var $schemaKeys = Object.keys($schema); }}
    {{ /* sort keys so that those that are easier to fail (e.g. type) are validated sooner */ }}

    {{~ $schemaKeys:$key }}
      {{ var $rule = it.RULES[$key]; }}
      {{? $rule }}
        var rule = RULES.{{=$key}};

        /* check if rule applies to data type */
        if ( !rule.type || rule.type == dataType ) {
          {{ $paths.push($key); /* do I need it? */ }}
          {{= $rule.code({ schema: $schema[$key], generate: $generateValidator }) }}

          if (!valid) {
            {{? $opts.allErrors }}
              errors.push(error);
            {{??}}
              return {
                valid: false,
                errors: [error]
                {{? $opts.verbose }}
                  , data: data
                {{?}}
              };
            {{?}}
          }

          {{  $paths.pop(); /* do I need it? */ }}
          {{ /* reporting? */ }}
        }
      {{?}}
    {{~}}

  {{  })(it.schema);  }}

  return {
    valid: {{? $opts.allErrors }}!errors.length{{??}}true{{?}},
    errors: errors
  };
};
