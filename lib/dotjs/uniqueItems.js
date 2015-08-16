'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['uniqueItems'],
    $schemaPath = it.schemaPath + '.' + 'uniqueItems',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  if ($schema && it.opts.uniqueItems !== false) {
    out += ' var ' + ($valid) + ' = true; if (' + ($data) + '.length > 1) { var i = ' + ($data) + '.length, j; outer: for (;i--;) { for (j = i; j--;) { if (equal(' + ($data) + '[i], ' + ($data) + '[j])) { ' + ($valid) + ' = false; break outer; } } } } if (!' + ($valid) + ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('uniqueItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'items ## \' + j + \' and \' + i + \' are duplicate\' ';
      if (it.opts.verbose) {
        out += ', schema: ' + ($schema) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('uniqueItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'items ## \' + j + \' and \' + i + \' are duplicate\' ';
      if (it.opts.verbose) {
        out += ', schema: ' + ($schema) + ', data: ' + ($data);
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
