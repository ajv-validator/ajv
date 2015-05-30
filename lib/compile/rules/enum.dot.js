function (data, dataType, dataPath) {
  'use strict';
  /* TODO change to inline */

  {{  
    var $itemsHash = {};
    it.schema.forEach(function ($item) {
      $itemsHash[it.stableStringify($item)] = true;
    });
  }}

  var itemsHash = {{= JSON.stringify($itemsHash) }};
  var valid = itemsHash[stableStringify(data)];

  if (!valid) validate.errors.push({
    keyword: 'enum',
    dataPath: dataPath,
    message: 'should be equal to one of values'
    {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath }}, data: data{{?}}
  });

  return valid || false;
}
