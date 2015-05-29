function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{
    var $schemaDeps = {}
      , $propertyDeps = {};

    for ($property in it.schema) {
      var $schema = it.schema[$property];
      var $deps = Array.isArray($schema) ? $propertyDeps : $schemaDeps;
      $deps[$property] = $schema;
    }
  }}

  {{ for ($property in $propertyDeps) { }}
    if (data.hasOwnProperty('{{= $property }}')) {
      {{ $deps = $propertyDeps[$property]; }}
      var valid = {{~ $deps:$dep:$i }}{{?$i}} && {{?}}data.hasOwnProperty('{{= $dep}}'){{~}};
      if (!valid) {
        var error = {
          keyword: 'dependencies',
          schema: self.schema{{= it.schemaPath }},
          dataPath: dataPath,
          message: 'data' + dataPath + ' is not valid, {{? $deps.length == 1 }}property {{= $deps[0] }} is{{??}}properties {{= $deps.join(",") }} are{{?}} required when property {{= $property }} is present'
          {{? it.opts.verbose }}, data: data{{?}}
        };

        {{? it.opts.allErrors }}
          errors.push(error);
        {{??}}
          return { valid: false, errors: [error] };
        {{?}}
      }
    }
  {{ } }}

  {{ for ($property in $schemaDeps) { }}
    if (data.hasOwnProperty('{{= $property }}')) {
      {{ 
        var $schema = $schemaDeps[$property];
        var $it = it.copy(it);
        $it.schema = $schema;
        $it.schemaPath = it.schemaPath + '["' + it.escapeQuotes($property) + '"]';
      }}

      var result = ({{= it._validate($it) }})(data, dataType, dataPath);

      if (!result.valid) {
        {{? it.opts.allErrors }}
          errors.push.apply(errors, result.errors);
        {{??}}
          return { valid: false, errors: result.errors };
        {{?}}
      }
    }
  {{ } }}

  {{? it.opts.allErrors }}
    return { valid: !errors.length, errors: errors };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
