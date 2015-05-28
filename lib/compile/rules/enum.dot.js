function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{  
    var $simpleTypes = [ 'boolean', 'null', 'number', 'string' ]
      , $itemsHash = { 'boolean': {}, 'null': {}, 'number': {}, 'string': {} };

    var $onlySimpleTypes = it.schema.every(function ($item) {
      var $itemType = typeof $item;
      var $isSimpleType = $simpleTypes.indexOf($itemType) >= 0;
      if ($isSimpleType) $itemsHash[$itemType][$item] = true;
      return $isSimpleType;
    });

    if (!$onlySimpleTypes) {
      var $itemsList = it.schema.map(function ($item) {
        return {
          type: it.getDataType($item),
          valueStr: it.stableStringify($item)
        }
      });
    }
  }}

  {{? $onlySimpleTypes }}
    var itemsHash = {{= JSON.stringify($itemsHash) }};
    var valid = itemsHash[dataType] && itemsHash[dataType][data];
  {{??}}
    var itemsList = {{= JSON.stringify($itemsList) }};
    for (var i = 0; i < itemsList.length; i++) {
      var item = itemsList[i];
      var valid = dataType == item.type && stableStringify(data) == item.valueStr;
      if (valid) break;
    }
  {{?}}

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
