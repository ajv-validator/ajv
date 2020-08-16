import {MissingRefError} from "./error_classes"

module.exports = compileAsync

type Callback = (...args: any[]) => void

/**
 * Creates validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and returns promise that resolves with the schema.
 * @this  Ajv
 * @param {Object}   schema schema object
 * @param {Boolean}  meta optional true to compile meta-schema; this parameter can be skipped
 * @param {Function} callback an optional node-style callback, it is called with 2 parameters: error (or null) and validating function.
 * @return {Promise} promise that resolves with a validating function.
 */
function compileAsync(schema, meta?: boolean | Callback, callback?: Callback) {
  /* eslint no-shadow: 0 */
  /* jshint validthis: true */
  var self = this
  if (typeof this._opts.loadSchema != "function") {
    throw new Error("options.loadSchema should be a function")
  }

  if (typeof meta == "function") {
    callback = meta
    meta = undefined
  }

  var p = loadMetaSchemaOf(schema).then(() => {
    var schemaObj = this._addSchema(schema, undefined, meta)
    return schemaObj.validate || _compileAsync(schemaObj)
  })

  if (callback) {
    p.then((v) => (<Callback>callback)(null, v), callback)
  }

  return p

  function loadMetaSchemaOf(sch) {
    var $schema = sch.$schema
    return $schema && !self.getSchema($schema)
      ? compileAsync.call(self, {$ref: $schema}, true)
      : Promise.resolve()
  }

  function _compileAsync(schemaObj) {
    try {
      return self._compile(schemaObj)
    } catch (e) {
      if (e instanceof MissingRefError) return loadMissingSchema(e)
      throw e
    }

    function loadMissingSchema(e) {
      var ref = e.missingSchema
      if (added(ref)) {
        throw new Error("Schema " + ref + " is loaded but " + e.missingRef + " cannot be resolved")
      }

      var schemaPromise = self._loadingSchemas[ref]
      if (!schemaPromise) {
        schemaPromise = self._loadingSchemas[ref] = self._opts.loadSchema(ref)
        schemaPromise.then(removePromise, removePromise)
      }

      return schemaPromise
        .then((sch) => {
          if (!added(ref)) {
            return loadMetaSchemaOf(sch).then(() => {
              if (!added(ref)) self.addSchema(sch, ref, undefined, meta)
            })
          }
        })
        .then(() => _compileAsync(schemaObj))

      function removePromise() {
        delete self._loadingSchemas[ref]
      }

      function added(ref) {
        return self._refs[ref] || self._schemas[ref]
      }
    }
  }
}
