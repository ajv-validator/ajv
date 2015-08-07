'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['$ref'],
    $schemaPath = it.schemaPath + '.' + '$ref',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  if (it.opts._debug) {
    out += ' console.log(\'Keyword ' + ('$ref') + '\'); ';
  }
  if ($schema == '#' || $schema == '#/') {
    if (it.isRoot) {
      if ($breakOnError && it.wasTop) {
        out += ' if (! ' + ('validate') + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) return false; else { ';
      } else {
        out += '  if (! ' + ('validate') + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (vErrors === null) vErrors = ' + ('validate') + '.errors; else vErrors = vErrors.concat(' + ('validate') + '.errors); errors = vErrors.length; } ';
        if ($breakOnError) {
          out += ' else { ';
        }
      }
    } else {
      out += '  if (! ' + ('rootRefVal[0]') + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (vErrors === null) vErrors = ' + ('rootRefVal[0]') + '.errors; else vErrors = vErrors.concat(' + ('rootRefVal[0]') + '.errors); errors = vErrors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  } else {
    var $refVal = it.resolveRef(it.baseId, $schema, it.rootId);
    if ($refVal === undefined) {
      var $message = 'can\'t resolve reference ' + $schema + ' from id ' + it.baseId;
      if (it.opts.missingRefs == 'fail') {
        console.log($message);
        if (it.wasTop && $breakOnError) {
          out += ' validate.errors = [ { keyword: \'' + ('$ref') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'can\\\'t resolve reference ' + (it.util.escapeQuotes($schema)) + '\' ';
          if (it.opts.verbose) {
            out += ', schema: \'' + (it.util.escapeQuotes($schema)) + '\', data: ' + ($data);
          }
          out += ' }]; return false; ';
        } else {
          out += '  var err =   { keyword: \'' + ('$ref') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'can\\\'t resolve reference ' + (it.util.escapeQuotes($schema)) + '\' ';
          if (it.opts.verbose) {
            out += ', schema: \'' + (it.util.escapeQuotes($schema)) + '\', data: ' + ($data);
          }
          out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
        }
        if ($breakOnError) {
          out += ' if (false) { ';
        }
      } else if (it.opts.missingRefs == 'ignore') {
        console.log($message);
        if ($breakOnError) {
          out += ' if (true) { ';
        }
      } else {
        throw new Error($message);
      }
    } else {
      out += '  if (! ' + ($refVal) + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (vErrors === null) vErrors = ' + ($refVal) + '.errors; else vErrors = vErrors.concat(' + ($refVal) + '.errors); errors = vErrors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  }
  return out;
}
