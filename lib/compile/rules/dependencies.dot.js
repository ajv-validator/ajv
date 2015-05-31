function (data, dataPath) {
  {{? it.opts.allErrors }} var errs = validate.errors.length; {{?}}

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
        validate.errors.push({
          keyword: 'dependencies',
          dataPath: dataPath,
          message: '{{? $deps.length == 1 }}property {{= $deps[0] }} is{{??}}properties {{= $deps.join(",") }} are{{?}} required when property {{= $property }} is present'
          {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath }}, data: data{{?}}
        });

        {{? !it.opts.allErrors }} return false; {{?}}
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

      {{? !it.opts.allErrors }} var valid = {{?}}
        ({{= it.validate($it) }})(data, dataPath);

      {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
    }
  {{ } }}

  return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
}
