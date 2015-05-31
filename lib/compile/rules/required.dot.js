{{ var $schema = it.schema.required; }}
{{? $schema.length <= 100 }}
  var valid = {{~ $schema:$property:$i }}
                {{? $i}} && {{?}}
                data.hasOwnProperty('{{= it.escapeQuotes($property) }}')
              {{~}};
{{??}}
  var valid = true;
  var req_schema = validate.schema{{= it.schemaPath + '.required' }};

  for (var i = 0; i < req_schema.length; i++) {
    var property = req_schema[i]
      , valid = valid && data.hasOwnProperty(req_schema[i]);

    {{? !it.opts.allErrors }} if (!valid) break; {{?}}
  }
{{?}}

if (!valid) validate.errors.push({
  keyword: 'required',
  dataPath: dataPath,
  message: 'properties {{= $schema.slice(0, 7).join(",") }}{{? $schema.length > 7}}...{{?}} are required'
  {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath + '.required' }}, data: data{{?}}
});
