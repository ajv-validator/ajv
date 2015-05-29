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
      schema: self.schema{{= it.schemaPath }},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid, should be equal to one of values in the schema'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
