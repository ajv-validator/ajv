'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['format'],
    $schemaPath = it.schemaPath + '.' + 'format',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $format = it.formats[$schema];
  if (it.opts.format !== false && $format) {
    out += ' if (!   ';
    if (typeof $format == 'function') {
      out += ' formats' + (it.util.getProperty($schema)) + ' (' + ($data) + ') ';
    } else {
      out += ' formats' + (it.util.getProperty($schema)) + ' .test(' + ($data) + ') ';
    }
    out += ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('format') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match format ' + (it.util.escapeQuotes($schema)) + '\' ';
      if (it.opts.verbose) {
        out += ', schema: ' + (it.util.toQuotedString($schema)) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('format') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match format ' + (it.util.escapeQuotes($schema)) + '\' ';
      if (it.opts.verbose) {
        out += ', schema: ' + (it.util.toQuotedString($schema)) + ', data: ' + ($data);
      }
      out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
}
