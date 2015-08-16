'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['multipleOf'],
    $schemaPath = it.schemaPath + '.' + 'multipleOf',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  out += 'var division' + ($lvl) + ' = ' + ($data) + ' / ' + ($schema) + ';if (' + ($data) + ' / ' + ($schema) + ' !== parseInt(division' + ($lvl) + ')) {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('multipleOf') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should be multiple of ' + ($schema) + '\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('multipleOf') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should be multiple of ' + ($schema) + '\' ';
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
