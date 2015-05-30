{{? it.opts.format !== false }}
  var format = formats['{{= it.schema.format }}'];
  var valid = typeof format == 'function'
                ? format(data)
                : !format || format.test(data);

  if (!valid) validate.errors.push({
    keyword: 'format',
    dataPath: dataPath,
    message: 'should match format "{{= it.schema.format }}"'
    {{? it.opts.verbose }}, schema: '{{= it.schema.format }}', data: data{{?}}
  });
{{??}}
  var valid = true;
{{?}}
