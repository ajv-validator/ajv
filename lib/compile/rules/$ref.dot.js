function (data, dataType, dataPath) {
  'use strict';

  {{? it.resolveRef(it.schema) }}
    var result = validateRef('{{= it.schema }}', data, dataType, dataPath);
    if (!result.valid) validate.errors.push.apply(validate.errors, result.errors);
    return result.valid;

  {{??}}
    validate.errors.push({
      keyword: '$ref',
      schema: '{{= it.schema }}',
      dataPath: dataPath,
      message: 'can\'t resolve reference {{= it.schema}}'
      {{? it.opts.verbose }}, data: data{{?}}
    });
    return false;
  {{?}}
}
