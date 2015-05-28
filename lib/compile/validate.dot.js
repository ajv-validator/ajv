'use strict';

{{ /**
    * it = { schema, RULES, _validate, opts }
    * getDataType is defined in the parent scope in index.js
    */ }}

validate = function(data, instance) {
  var self = this;
  var dataType = getDataType(data);
  var result = ({{= it._validate(it) }})(data, dataType, '');
  return result;
}
