'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['anyOf'],
    $schemaPath = it.schemaPath + '.' + 'anyOf',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  var $noEmptySchema = $schema.every(function($sch) {
    return it.util.schemaHasRules($sch, it.RULES.all);
  });
  if ($noEmptySchema) {
    out += ' var ' + ($errs) + ' = errors; var ' + ($valid) + ' = false; ';
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[' + $i + ']';
        out += ' ' + (it.validate($it)) + ' ' + ($valid) + ' = ' + ($valid) + ' || valid' + ($it.level) + '; if (!' + ($valid) + ') { ';
        $closingBraces += '}';
      }
    }
    out += ' ' + ($closingBraces) + ' if (!' + ($valid) + ') {  var err =   { keyword: \'' + ('anyOf') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match some schema in anyOf\' ';
    if (it.opts.verbose) {
      out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
    }
    out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } else { errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
    out = it.util.cleanUpCode(out);
  } else {
    if ($breakOnError) {
      out += ' if (true) { ';
    }
  }
  return out;
}
