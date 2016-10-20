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
  if (typeof this._opts.loadSchema != 'function')
    throw new Error('options.loadSchema should be a function');

  var p = Promise.resolve().then(function () {
    schemaObj = self._addSchema(schema);
    return schemaObj.validate || _compileAsync(schemaObj);
  });

  if (callback) {
    p.then(
      function(v) { callback(null, v); },
      callback
    );
  }

  return p;


  function _compileAsync(schemaObj) {
    try { return self._compile(schemaObj); }
    catch(e) {
      if (!e.missingSchema) throw e;
      return loadMissingSchema(e);
    }


    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (added(ref)) throw new Error('Schema ' + ref + ' is loaded but ' + e.missingRef + ' cannot be resolved');

      var schemaPromise = self._loadingSchemas[ref];
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref);
        schemaPromise.then(removePromise, removePromise);
      }

      return schemaPromise.then(function (sch) {
        if (!added(ref)) self.addSchema(sch, ref);
        return _compileAsync(schemaObj);
      });

      function removePromise() {
        delete self._loadingSchemas[ref];
      }

      function added(ref) {
        return self._refs[ref] || self._schemas[ref];
      }
    }
  }
}
