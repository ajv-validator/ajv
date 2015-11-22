'use strict';


module.exports = {
  enable: enableV5
};


function enableV5(ajv) {
  ajv.addKeyword('constant', { macro: constantMacro });
  ajv.addKeyword('contains', { macro: containsMacro });
}

function constantMacro(schema) {
  return { enum: [schema] };
}

function containsMacro(schema) {
  return { not: { items: { not: schema } } };
}
