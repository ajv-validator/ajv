function (data, dataPath) {
  'use strict';

  {{? it.resolveRef(it.schema) }}
    var result = validateRef('{{= it.schema }}', data, dataPath);
    if (!result.valid) validate.errors.push.apply(validate.errors, result.errors);
    return result.valid;

  {{??}}
    validate.errors.push({
      keyword: '$ref',
      dataPath: dataPath,
      message: 'can\'t resolve reference {{= it.schema}}'
      {{? it.opts.verbose }}, schema: '{{= it.schema }}', data: data{{?}}
    });
    return false;
  {{?}}
}
