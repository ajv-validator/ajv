'use strict';

var traverse = require('json-schema-traverse');


module.exports = {
  prepareSchema: prepareSchema,
  wrapFunc: wrapFunc
};


function prepareSchema(schema) {
  schema = JSON.parse(JSON.stringify(schema));
  traverse(schema, function (sch) {
    for (var key in sch) {
      var value = sch[key];
      if (value.$param) {
        value.$data = '/params' + value.$param;
        delete value.$param;
      } else if (value.$data && value.$data[0] == '/') {
        value.$data = '/data' + value.$data;
      }
    }
  });

  schema = {
    // type: 'object',
    // required: ['params', 'data'],
    // additionalProperties: false,
    properties: {
      params: {},
      data: {$ref: '#/definitions/data'}
    },
    definitions: {
      data: schema
    }
  };

  return schema;
}


function wrapFunc (validate, $params) {
  // TODO validate $params or add $params to meta-schema
  // TODO compile $params schema
  // TODO $ref with $params
  getValidate.$params = $params;
  return getValidate;

  function getValidate (params) {
    // TODO validate params
    // TODO partial params

    return function v (data) {
      var valid = validate({params: params, data: data});
      v.errors = validate.errors;
      // TODO iterate errors and change dataPath and schemaPath
      return valid;
    };
  }
}
