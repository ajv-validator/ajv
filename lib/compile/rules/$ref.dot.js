function (data, dataType, dataPath) {
  'use strict';

  {{? it.resolveRef(it.schema) }}
    return validateRef('{{= it.schema }}', data, dataType, dataPath);
  {{??}}
    return { valid: false, errors: [{
      keyword: '$ref',
      schema: '{{= it.schema }}',
      dataPath: dataPath,
      message: 'can\'t resolve reference {{= it.schema}}'
      {{? it.opts.verbose }}, data: data{{?}}
    }] };
  {{?}}
}
