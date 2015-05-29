function (data, dataType, dataPath) {
  'use strict';

  {{? it.opts.format !== false }}
    var format = formats['{{= it.schema }}'];
    var valid = typeof format == 'function'
                  ? format(data)
                  : !format || format.test(data);

    return {
      valid: valid,
      errors: valid ? [] : [{
        keyword: 'format',
        schema: '{{= it.schema }}',
        dataPath: dataPath,
        message: 'data' + dataPath + ' is not valid, should match format "{{= it.schema }}"'
        {{? it.opts.verbose }}, data: data{{?}}
      }]
    };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
