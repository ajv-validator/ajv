'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['not'],
    $schemaPath = it.schemaPath + '.' + 'not',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  if (it.util.schemaHasRules($schema, it.RULES.all)) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    out += ' var ' + ($errs) + ' = errors; ' + (it.validate($it)) + ' if (valid' + ($it.level) + ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('not') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT be valid\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('not') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT be valid\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' } else { errors = ' + ($errs) + '; if (vErrors !== null) { if (' + ($errs) + ') vErrors.length = ' + ($errs) + '; else vErrors = null; } ';
    if (it.opts.allErrors) {
      out += ' } ';
    }
  } else {
    out += '  var err =   { keyword: \'' + ('not') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT be valid\' ';
    if (it.opts.verbose) {
      out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
    }
    out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    if ($breakOnError) {
      out += ' if (false) { ';
    }
  }
  return out;
}
