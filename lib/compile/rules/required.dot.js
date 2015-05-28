function (data, dataType, dataPath) {
  'use strict';

  var valid = true, missing = '';
  var schema = self.schema{{= it.schemaPath }};

  for (var i = 0; i < schema.length; i++) {
    var property = schema[i]
      , has = data.hasOwnProperty(schema[i])
      , valid = valid && has;

    if (!has) {
      {{? it.opts.allErrors }}
        missing += ', ' + property;
      {{??}}
        missing = property;
        break;
      {{?}}
    }
  }

  {{? it.opts.allErrors }}
    missing = missing.slice(2);
  {{?}}

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'required',
      schema: self.schema{{= it.schemaPath }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, properties ' + missing + ' are missing'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
