'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['maxItems'],
    $schemaPath = it.schemaPath + '.' + 'maxItems',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  out += 'if (' + ($data) + '.length > ' + ($schema) + ') {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('maxItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT have more than ' + ($schema) + ' items\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('maxItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT have more than ' + ($schema) + ' items\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}
