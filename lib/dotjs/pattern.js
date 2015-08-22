'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['pattern'],
    $schemaPath = it.schemaPath + '.' + 'pattern',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  new RegExp($schema);
  out += 'if (! /' + (it.util.escapeRegExp($schema)) + '/.test(' + ($data) + ') ) {  ';
  if (it.wasTop && $breakOnError) {
    out += ' validate.errors = [ { keyword: \'' + ('pattern') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match pattern "' + (it.util.escapeQuotes($schema)) + '"\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + (it.util.toQuotedString($schema)) + ', data: ' + ($data);
    }
    out += ' }]; return false; ';
  } else {
    out += '  var err =   { keyword: \'' + ('pattern') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should match pattern "' + (it.util.escapeQuotes($schema)) + '"\' ';
    if (it.opts.verbose) {
      out += ', schema: ' + (it.util.toQuotedString($schema)) + ', data: ' + ($data);
    }
    out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
  }
  out += '} ';
  if ($breakOnError) {
    out += ' else { ';
  }
  return out;
}
