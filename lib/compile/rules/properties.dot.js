function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{ var $properties = Object.keys(it.schema); }}

  {{~ $properties:$property }}
    {{ 
      var $it = it.copy(it);
      $it.schema = it.schema[$property];
      $it.schemaPath = it.schemaPath + '.' + $property;
    }}

    if (data.hasOwnProperty('{{= $property }}')) {
      var _data = data['{{= $property }}']
        , _dataType = getDataType(_data)
        , _dataPath = dataPath + '.{{= $property }}'
        , result = ({{= it._validate($it) }})(_data, _dataType, _dataPath);

      if (!result.valid) {
        {{? it.opts.allErrors }}
          errors.push.apply(errors, result.errors);
        {{??}}
          return result;
        {{?}}
      }
    }
  {{~}}

  {{? it.opts.allErrors }}
    return { valid: !errors.length, errors: errors };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
