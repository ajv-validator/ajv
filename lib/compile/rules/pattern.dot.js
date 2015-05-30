{{ new RegExp(it.schema.pattern); /* test if regexp is valid to fail at compile time rather than in eval */}}
var valid = /{{= it.schema.pattern }}/.test(data);

if (!valid) validate.errors.push({
  keyword: 'minimum',
  schema: '{{= it.schema.pattern }}',
  dataPath: dataPath,
  message: 'should match pattern "{{= it.schema.pattern }}"'
  {{? it.opts.verbose }}, data: data{{?}}
});
