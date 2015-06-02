{{ var $schema = it.schema.required; }}
{{? $schema.length <= 100 }}
  var valid = {{~ $schema:$property:$i }}
                {{? $i}} && {{?}}
                data.hasOwnProperty('{{= it.escapeQuotes($property) }}')
              {{~}};
{{??}}
  {{ var $lvl = it.level; }}
  var valid = true;
  var schema{{=$lvl}} = validate.schema{{= it.schemaPath + '.required' }};

  for (var i = 0; i < schema{{=$lvl}}.length; i++) {
    var property = schema{{=$lvl}}[i]
      , valid = valid && data.hasOwnProperty(schema{{=$lvl}}[i]);

    {{? !it.opts.allErrors }} if (!valid) break; {{?}}
  }
{{?}}

if (!valid) validate.errors.push({
  keyword: 'required',
  dataPath: dataPath,
  message: 'properties {{= $schema.slice(0, 7).join(",") }}{{? $schema.length > 7}}...{{?}} are required'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.required' }}, data: data{{?}}
});
