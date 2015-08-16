'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['oneOf'],
    $schemaPath = it.schemaPath + '.' + 'oneOf',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  out += 'var ' + ($errs) + ' = errors;var prevValid' + ($lvl) + ' = false;var ' + ($valid) + ' = false;';
  var arr1 = $schema;
  if (arr1) {
    var $sch, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $sch = arr1[$i += 1];
      if (it.util.schemaHasRules($sch, it.RULES.all)) {
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        out += ' ' + (it.validate($it)) + ' ';
      } else {
        out += ' var valid' + ($it.level) + ' = true; ';
      }
      if ($i) {
        out += ' if (valid' + ($it.level) + ' && prevValid' + ($lvl) + ') ' + ($valid) + ' = false; else { ';
        $closingBraces += '}';
      }
      out += ' if (valid' + ($it.level) + ') ' + ($valid) + ' = prevValid' + ($lvl) + ' = true;';
    }
  }
  out += '' + ($closingBraces) + 'if (!' + ($valid) + ') {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('oneOf') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match exactly one schema in oneOf\' ';
    if (it.opts.verbose) {
      out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('oneOf') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match exactly one schema in oneOf\' ';
    if (it.opts.verbose) {
      out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
    }
    out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} else { errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; }';
  if (it.opts.allErrors) {
    out += ' } ';
  }
  return out;
}
