'use strict';

var util = require('./util');

module.exports = {
  expand: expandMacros,
  hasMacro: hasMacro
};


function expandMacros() {
  /* jshint validthis: true */
  var macros = this.RULES.macros
    , schema = this.schema
    , expSchemas, i, key;
  for (i=0; i<macros.length; i++) {
    var rule = macros[i]
      , keywordSchema = schema[rule.keyword];
    if (keywordSchema !== undefined) {
      var expanded = rule.macro(keywordSchema, schema);
      delete schema[rule.keyword];
      expandMacros.call({ RULES: this.RULES, schema: expanded });
      if (expSchemas) expSchemas[expSchemas.length] = expanded;
      else expSchemas = [expanded];
    }
  }

  if (expSchemas) {
    if (this.self.opts.validateSchema !== false)
      this.self.validateSchema({ "allOf": expSchemas }, true);

    var schemaCopy;
    if (Object.keys(schema).length > 0)
      schemaCopy = util.copy(schema);

    var success = true;
    out: // try to merge schemas without merging keywords
    for (i=0; i<expSchemas.length; i++) {
      var sch = expSchemas[i];
      for (key in sch) {
        if (schema[key] === undefined)
          schema[key] = sch[key];
        else {
          success = false;
          break out;
        }
      }
    }

    if (!success) {
      for (key in schema) delete schema[key];
      if (schemaCopy) expSchemas[expSchemas.length] = schemaCopy;
      schema.allOf = expSchemas;
    }
  }
}


function hasMacro(schema, RULES) {
  for (var key in schema) {
    if (RULES.allMacros[key]) return true;
    var sch = schema[key];
    switch (key) {
      case 'properties':
      case 'patternProperties':
      case 'dependencies':
        for (var prop in sch)
          if (typeof sch[prop] == 'object' && hasMacro(sch[prop], RULES))
            return true;
        break;
      case 'additionalProperties':
        if (typeof sch != 'object') break;
        /* falls through */
      case 'not':
        if (hasMacro(sch, RULES)) return true;
        break;
      case 'items':
        if (!Array.isArray(sch)) {
          if (hasMacro(sch, RULES)) return true;
          break;
        }
        /* falls through */
      case 'anyOf':
      case 'oneOf':
      case 'allOf':
        for (var i=0; i<sch.length; i++)
          if (hasMacro(sch[i], RULES))
            return true;
    }
  }
}
