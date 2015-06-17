'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['$ref'],
    $schemaPath = it.schemaPath + '.' + '$ref',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  if (it.opts._debug) {
    out += ' console.log(\'Keyword ' + ('$ref') + '\'); ';
  }
  if ($schema == '#' || $schema == '#/') {
    if (it.isRoot) {
      if ($breakOnError && it.wasTop) {
        out += ' if (! ' + ('validate') + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) return false; else { ';
      } else {
        out += ' var errors' + ($lvl) + ' = validate.errors; if (! ' + ('validate') + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (errors' + ($lvl) + ' !== null) validate.errors = errors' + ($lvl) + '.concat(validate.errors); errors = validate.errors.length; } ';
        if ($breakOnError) {
          out += ' else { ';
        }
      }
    } else {
      var $v = 'v' + $lvl;
      out += ' var ' + ($v) + ' = root.refVal[0];  if (! ' + ($v) + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (validate.errors === null) validate.errors = ' + ($v) + '.errors; else validate.errors = validate.errors.concat(' + ($v) + '.errors); errors = validate.errors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  } else {
    var $refVal = it.resolveRef(it.baseId, $schema, it.rootId);
    if ($refVal === undefined) {
      if (it.wasTop && $breakOnError) {
        out += ' validate.errors = [ { keyword: \'' + ('$ref') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'can\\\'t resolve reference ' + ($schema) + '\' ';
        if (it.opts.verbose) {
          out += ', schema: \'' + ($schema) + '\', data: ' + ($data);
        }
        out += ' }]; return false; ';
      } else {
        out += ' var err =   { keyword: \'' + ('$ref') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'can\\\'t resolve reference ' + ($schema) + '\' ';
        if (it.opts.verbose) {
          out += ', schema: \'' + ($schema) + '\', data: ' + ($data);
        }
        out += ' }; if (validate.errors === null) validate.errors = [err]; else validate.errors.push(err); errors++; ';
      }
      if ($breakOnError) {
        out += ' if (false) { ';
      }
    } else {
      var $v = 'v' + $lvl;
      out += ' var ' + ($v) + ' = ' + ($refVal) + ';  if (! ' + ($v) + '(' + ($data) + ', (dataPath || \'\') + ' + (it.errorPath) + ') ) { if (validate.errors === null) validate.errors = ' + ($v) + '.errors; else validate.errors = validate.errors.concat(' + ($v) + '.errors); errors = validate.errors.length; } ';
      if ($breakOnError) {
        out += ' else { ';
      }
    }
  }
  return out;
}
