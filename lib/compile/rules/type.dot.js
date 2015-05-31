{{ var $isArray = Array.isArray(it.schema.type); }}

{{? $isArray }}
  var valid = {{= it.checkDataTypes(it.schema.type) }};
{{??}}
  var valid = {{= it.checkDataType(it.schema.type) }};
{{?}}


if (!valid) validate.errors.push({
  keyword: 'type',
  dataPath: dataPath,
  message: 'should be {{? $isArray }}{{= it.schema.type.join(",") }}{{??}}{{= it.schema.type }}{{?}}'
  {{? it.opts.verbose }}, schema: {{? $isArray }}validate.schema{{= it.schemaPath + '.type' }}{{??}}'{{= it.schema.type }}'{{?}}, data: data{{?}}
});
