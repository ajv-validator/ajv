function (data, dataType, dataPath) {
  'use strict';
  /* TODO change to inline ??? */

  var errs = validate.errors.length;

  var valid = ({{= it.validate(it) }})(data, dataType, dataPath);
  valid = !valid;

  if (valid) validate.errors.length = errs;
  else validate.errors.push({
    keyword: 'not',
    dataPath: dataPath,
    message: 'should NOT be valid'
    {{? it.opts.verbose }}, schema: validate.schema{{= it.schemaPath }}, data: data{{?}}
  });

  return valid;
}
