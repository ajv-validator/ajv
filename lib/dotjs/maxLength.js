'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['maxLength'],
    $schemaPath = it.schemaPath + '.' + 'maxLength',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  if (it.opts._debug) {
    out += ' console.log(\'Keyword ' + ('maxLength') + '\'); ';
  }
  out += 'if ( ';
  if (it.opts.unicode === false) {
    out += ' ' + ($data) + '.length ';
  } else {
    out += ' ucs2length(' + ($data) + ') ';
  }
  out += ' > ' + ($schema) + ') {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('maxLength') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT be longer than ' + ($schema) + ' characters\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('maxLength') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT be longer than ' + ($schema) + ' characters\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + ($schema) + ', data: ' + ($data);
    }
    out += ' }; if (validate.errors === null) validate.errors = [err]; else validate.errors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}
