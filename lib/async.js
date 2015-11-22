'use strict';

/**
 * Create validating function for passed schema with asynchronous loading of missing schemas.
 * `loadSchema` option should be a function that accepts schema uri and node-style callback.
 * @param  {String|Object} schema
 * @param  {Function} callback node-style callback, it is always called with 2 parameters: error (or null) and validating function.
 */
module.exports = function compileAsync(schema, callback) {
  var schemaObj;
  var self = this;
  try {
    schemaObj = this._addSchema(schema);
  } catch(e) {
    setTimeout(function() { callback(e); });
    return;
  }
  if (schemaObj.validate)
    setTimeout(function() { callback(null, schemaObj.validate); });
  else {
    if (typeof this.opts.loadSchema != 'function')
      throw new Error('options.loadSchema should be a function');
    _compileAsync(schema, callback, true);
  }


  function _compileAsync(schema, callback, firstCall) {
    var validate;
    try { validate = self.compile(schema); }
    catch(e) {
      if (e.missingSchema) loadMissingSchema(e);
      else deferCallback(e);
      return;
    }
    deferCallback(null, validate);

    function loadMissingSchema(e) {
      var ref = e.missingSchema;
      if (self._refs[ref] || self._schemas[ref])
        return callback(new Error('Schema ' + ref + ' is loaded but' + e.missingRef + 'cannot be resolved'));
      var _callbacks = self._loadingSchemas[ref];
      if (_callbacks) {
        if (typeof _callbacks == 'function')
          self._loadingSchemas[ref] = [_callbacks, schemaLoaded];
        else
          _callbacks[_callbacks.length] = schemaLoaded;
      } else {
        self._loadingSchemas[ref] = schemaLoaded;
        self.opts.loadSchema(ref, function (err, sch) {
          var _callbacks = self._loadingSchemas[ref];
          delete self._loadingSchemas[ref];
          if (typeof _callbacks == 'function')
            _callbacks(err, sch);
          else
            for (var i=0; i<_callbacks.length; i++)
              _callbacks[i](err, sch);
        });
      }

      function schemaLoaded(err, sch) {
        if (err) callback(err);
        else {
          if (!(self._refs[ref] || self._schemas[ref])) {
            try {
              self.addSchema(sch, ref);
            } catch(e) {
              callback(e);
              return;
            }
          }
          _compileAsync(schema, callback);
        }
      }
    }

    function deferCallback(err, validate) {
      if (firstCall) setTimeout(function() { callback(err, validate); });
      else callback(err, validate);
    }
  }
};
