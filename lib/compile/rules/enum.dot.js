function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{  
    var $itemsHash = {};
    it.schema.forEach(function ($item) {
      $itemsHash[it.stableStringify($item)] = true;
    });
  }}

  var itemsHash = {{= JSON.stringify($itemsHash) }};
  var valid = itemsHash[stableStringify(data)];

  return {
    valid: valid || false,
    errors: valid ? [] : [{
      keyword: 'enum',
      schema: validate.schema{{= it.schemaPath }},
      dataPath: dataPath,
      message: 'should be equal to one of values'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
