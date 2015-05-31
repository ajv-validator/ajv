{{? it.resolveRef(it.schema.$ref) }}
  var result = validateRef('{{= it.schema.$ref }}', data, dataPath);
  if (!result.valid) validate.errors.push.apply(validate.errors, result.errors);
  var valid = result.valid;
{{??}}
  validate.errors.push({
    keyword: '$ref',
    dataPath: dataPath,
    message: 'can\'t resolve reference {{= it.schema.$ref}}'
    {{? it.opts.verbose }}, schema: '{{= it.schema.$ref }}', data: data{{?}}
  });
  var valid = false;
{{?}}
