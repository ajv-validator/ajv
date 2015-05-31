/**
 * schema compilation (render) time:
 * it = { schema, RULES, _validate, opts }
 * it.validate - this template function,
 * it is used recursively to generate code for subschemas
 * 
 * runtime:
 * "validate" is a variable name to which this function will be assigned
 * validateRef etc. are defined in the parent scope in index.js
 */

module.exports = function (it) {
  if (it.isRoot) {
    it.isRoot = false;
    var out = '\nfunction (data) { \n';
    out += 'var dataPath = ""; \n';
    out += (it.opts.allErrors ? 'var errs = ' : '') + 'validate.errors.length = 0; \n';
  } else {
    var out = '\nfunction (data, dataPath) { \n';
    if (it.opts.allErrors) out += 'var errs = validate.errors.length; \n';
  }


  it.RULES.forEach(function (rulesGroup) {
    if (shouldUseGroup(rulesGroup)) {
      if (rulesGroup.type) out += 'if (' + (it.checkDataType(rulesGroup.type)) + ') { \n';

      rulesGroup.rules.forEach(function (rule) {
        if (shouldUseRule(rule)) {
          if (rule.inline) out += rule.code(it) + ' \n';
          else {
            var $it = it.copy(it);
            $it.schema = it.schema[rule.keyword];
            $it.schemaPath = it.schemaPath + '.' + rule.keyword;
            $it.parentSchema = it.schema;
            $it.parentSchemaPath = it.schemaPath;

            if (!it.opts.allErrors) out += 'var valid = ';
            out += '(' + rule.code($it) + ')(data, dataPath); \n';
          }
          if (!it.opts.allErrors) out += ' if (!valid) return false; \n';
        }
      });

      if (rulesGroup.type) out += ' } \n';
    }
  });

  out += it.opts.allErrors
          ? 'return errs == validate.errors.length; \n'
          : 'return true; \n';

  return out + '} \n';


  function shouldUseGroup(rulesGroup) {
    return rulesGroup.rules.some(function(rule) {
      return shouldUseRule(rule);
    });
  }

  function shouldUseRule(rule) {
    var use = it.schema.hasOwnProperty(rule.keyword);
    if (!use && rule.keyword == 'properties') {
      var pProperties = it.schema.patternProperties
        , aProperties = it.schema.additionalProperties;
      use = (pProperties && Object.keys(pProperties).length) ||
            (aProperties === false || typeof aProperties == 'object');
    }
    return use;
  }
}
