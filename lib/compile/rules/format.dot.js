{{? it.opts.format !== false }}
  var format = formats['{{= it.schema.format }}'];
  var valid = typeof format == 'function'
                ? format(data)
                : !format || format.test(data);

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'format',
      schema: '{{= it.schema.format }}',
      dataPath: dataPath,
      message: 'should match format "{{= it.schema.format }}"'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
{{??}}
  return { valid: true, errors: [] };
{{?}}
