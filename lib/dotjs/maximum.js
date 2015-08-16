'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['maximum'],
    $schemaPath = it.schemaPath + '.' + 'maximum',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $exclusive = it.schema.exclusiveMaximum === true,
    $op = $exclusive ? '<' : '<=',
    $notOp = $exclusive ? '>=' : '>';
  out += 'if (' + ($data) + ' ' + ($notOp) + ' ' + ($schema) + ') {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('maximum') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should be ' + ($op) + ' ' + ($schema) + '\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('maximum') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should be ' + ($op) + ' ' + ($schema) + '\' ';
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
