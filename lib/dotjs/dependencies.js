'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['dependencies'],
    $schemaPath = it.schemaPath + '.' + 'dependencies',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  var $schemaDeps = {},
    $propertyDeps = {};
  for ($property in $schema) {
    var $sch = $schema[$property];
    var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
    $deps[$property] = $sch;
  }
  out += 'var ' + ($errs) + ' = errors;';
  for (var $property in $propertyDeps) {
    out += ' if (' + ($data) + (it.util.getProperty($property)) + ' !== undefined) { ';
    $deps = $propertyDeps[$property];
    out += ' if ( ';
    var arr1 = $deps;
    if (arr1) {
      var $dep, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $dep = arr1[$i += 1];
        if ($i) {
          out += ' || ';
        }
        out += ' ' + ($data) + (it.util.getProperty($dep)) + ' === undefined ';
      }
    }
    out += ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('dependencies') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'';
      if ($deps.length == 1) {
        out += 'property ' + (it.util.escapeQuotes($deps[0])) + ' is';
      } else {
        out += 'properties ' + (it.util.escapeQuotes($deps.join(", "))) + ' are';
      }
      out += ' required when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('dependencies') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'';
      if ($deps.length == 1) {
        out += 'property ' + (it.util.escapeQuotes($deps[0])) + ' is';
      } else {
        out += 'properties ' + (it.util.escapeQuotes($deps.join(", "))) + ' are';
      }
      out += ' required when property ' + (it.util.escapeQuotes($property)) + ' is present\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
    }
    out += ' }   ';
    if ($breakOnError) {
      $closingBraces += '}';
      out += ' else { ';
    }
    out += ' }';
  }
  for (var $property in $schemaDeps) {
    var $sch = $schemaDeps[$property];
    if (it.util.schemaHasRules($sch, it.RULES.all)) {
      out += ' valid' + ($it.level) + ' = true; if (' + ($data) + '[\'' + ($property) + '\'] !== undefined) { ';
      $it.schema = $sch;
      $it.schemaPath = $schemaPath + it.util.getProperty($property);
      out += ' ' + (it.validate($it)) + ' }  ';
      if ($breakOnError) {
        out += ' if (valid' + ($it.level) + ') { ';
        $closingBraces += '}';
      }
    }
  }
  if ($breakOnError) {
    out += '   ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  out = it.util.cleanUpCode(out);
  return out;
}
