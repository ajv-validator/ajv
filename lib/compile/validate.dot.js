'use strict';

{{ /**
    * it = { schema, RULES, _validate, opts }
    * getDataType is defined in the parent scope in index.js
    */ }}

validate = function(data, dataType, dataPath) {
  var self = this;
  var dataType = dataType || getDataType(data);
  return ({{= it._validate(it) }})(data, dataType, dataPath ||'');
}
