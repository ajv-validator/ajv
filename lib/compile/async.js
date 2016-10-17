'use strict';

module.exports = compileAsync;


/**
 * Creates validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
 * @this  Ajv
 * @param {Object}   schema schema object
 * @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
 * @return {Promise} promise that resolves with a validating function.
 */
function compileAsync(schema, callback) {
  /* eslint no-shadow: 0 */
  /* global Promise */
  /* jshint validthis: true */
  var schemaObj;
  var self = this;
  var p;
  try {
    schemaObj = this._addSchema(schema);
  } catch(e) {
    p = Promise.reject(e);
  }

  if (!p) {
    if (schemaObj.validate) {
      p = Promise.resolve(schemaObj.validate);
    } else {
      if (typeof this._opts.loadSchema != 'function')
        throw new Error('options.loadSchema should be a function');
      p = _compileAsync(schemaObj);
    }
  }

  if (callback) {
    p.then(
      function(v) { callback(null, v); },
      callback
    );
  }

  return p;


  function _compileAsync(schemaObj) {
    var validate;
    try { validate = self._compile(schemaObj); }
    catch(e) {
      return e.missingSchema
              ? loadMissingSchema(e)
              : Promise.reject(e);
    }
    return Promise.resolve(validate);


    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (self._refs[ref] || self._schemas[ref])
        return Promise.reject(new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved'));

      var schemaPromise = self._loadingSchemas[ref];
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
        schemaPromise.then(removePromise, removePromise);
      }

      return schemaPromise.then(function (sch) {
        if (!(self._refs[ref] || self._schemas[ref])) {
          try {
            self.addSchema(sch, ref);
          } catch(e) {
            return Promise.reject(e);
          }
        }
        return _compileAsync(schemaObj);
      });

      function removePromise() {
        delete self._loadingSchemas[ref];
      }
    }
  }
}
