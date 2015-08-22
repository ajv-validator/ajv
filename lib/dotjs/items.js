'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['items'],
    $schemaPath = it.schemaPath + '.' + 'items',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  var $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt;
  out += 'var ' + ($errs) + ' = errors;var ' + ($valid) + ';';
  if (Array.isArray($schema)) {
    var $additionalItems = it.schema.additionalItems;
    if ($additionalItems === false) {
      out += ' ' + ($valid) + ' = ' + ($data) + '.length <= ' + ($schema.length) + ';  if (!' + ($valid) + ') {  ';
      if (it.wasTop && $breakOnError) {
        out += ' validate.errors = [ { keyword: \'' + ('additionalItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT have more than ' + ($schema.length) + ' items\' ';
        if (it.opts.verbose) {
          out += ', schema: false, data: ' + ($data);
        }
        out += ' }]; return false; ';
      } else {
        out += '  var err =   { keyword: \'' + ('additionalItems') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'should NOT have more than ' + ($schema.length) + ' items\' ';
        if (it.opts.verbose) {
          out += ', schema: false, data: ' + ($data);
        }
        out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
      out += ' }  ';
      if ($breakOnError) {
        $closingBraces += '}';
        out += ' else { ';
      }
    }
    var arr1 = $schema;
    if (arr1) {
      var $sch, $i = -1,
        l1 = arr1.length - 1;
      while ($i < l1) {
        $sch = arr1[$i += 1];
        if (it.util.schemaHasRules($sch, it.RULES.all)) {
          out += ' valid' + ($it.level) + ' = true; if (' + ($data) + '.length > ' + ($i) + ') { ';
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + '[' + $i + ']';
          $it.errorPath = it.util.getPathExpr(it.errorPath, $i, it.opts.jsonPointers, true);
          var $passData = $data + '[' + $i + ']';
          var $code = it.validate($it);
          if (it.util.varOccurences($code, $nextData) < 2) {
            out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
          } else {
            out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
          }
          out += ' }  ';
          if ($breakOnError) {
            out += ' if (valid' + ($it.level) + ') { ';
            $closingBraces += '}';
          }
        }
      }
    }
    if (typeof $additionalItems == 'object' && it.util.schemaHasRules($additionalItems, it.RULES.all)) {
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
      out += ' valid' + ($it.level) + ' = true; if (' + ($data) + '.length > ' + ($schema.length) + ') {  for (var i' + ($lvl) + ' = ' + ($schema.length) + '; i' + ($lvl) + ' < ' + ($data) + '.length; i' + ($lvl) + '++) { ';
      $it.errorPath = it.util.getPathExpr(it.errorPath, 'i' + $lvl, it.opts.jsonPointers, true);
      var $passData = $data + '[i' + $lvl + ']';
      var $code = it.validate($it);
      if (it.util.varOccurences($code, $nextData) < 2) {
        out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
      } else {
        out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
      }
      if ($breakOnError) {
        out += ' if (!valid' + ($it.level) + ') break; ';
      }
      out += ' } }  ';
      if ($breakOnError) {
        out += ' if (valid' + ($it.level) + ') { ';
        $closingBraces += '}';
      }
    }
  } else if (it.util.schemaHasRules($schema, it.RULES.all)) {
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
    out += '  for (var i' + ($lvl) + ' = ' + (0) + '; i' + ($lvl) + ' < ' + ($data) + '.length; i' + ($lvl) + '++) { ';
    $it.errorPath = it.util.getPathExpr(it.errorPath, 'i' + $lvl, it.opts.jsonPointers, true);
    var $passData = $data + '[i' + $lvl + ']';
    var $code = it.validate($it);
    if (it.util.varOccurences($code, $nextData) < 2) {
      out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
    } else {
      out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
    }
    if ($breakOnError) {
      out += ' if (!valid' + ($it.level) + ') break; ';
    }
    out += ' }  ';
    if ($breakOnError) {
      out += ' if (valid' + ($it.level) + ') { ';
      $closingBraces += '}';
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  out = it.util.cleanUpCode(out);
  return out;
}
