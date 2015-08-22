'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['required'],
    $schemaPath = it.schemaPath + '.' + 'required',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  var $currentErrorPath = it.errorPath;
  if ($breakOnError) {
    out += ' var missing' + ($lvl) + '; ';
    if ($schema.length <= 20) {
      out += ' if ( ';
      var arr1 = $schema;
      if (arr1) {
        var $property, $i = -1,
          l1 = arr1.length - 1;
        while ($i < l1) {
          $property = arr1[$i += 1];
          if ($i) {
            out += ' || ';
          }
          var $prop = it.util.getProperty($property);
          out += ' ( ' + ($data) + ($prop) + ' === undefined && (missing' + ($lvl) + ' = ' + (it.util.toQuotedString(it.opts.jsonPointers ? $property : $prop)) + ') ) ';
        }
      }
      out += ') { ';
      var $propertyPath = 'missing' + $lvl,
        $missingProperty = '\' + ' + $propertyPath + ' + \'';
      it.errorPath = it.opts.jsonPointers ? it.util.getPathExpr($currentErrorPath, $propertyPath, true) : $currentErrorPath + ' + ' + $propertyPath;
      if (it.wasTop && $breakOnError) {
        out += ' validate.errors = [ { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
        if (it.opts.verbose) {
          out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
        }
        out += ' }]; return false; ';
      } else {
        out += '  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
        if (it.opts.verbose) {
          out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
        }
        out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
      out += ' } else { ';
    } else {
      out += '  var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + '; ';
      var $i = 'i' + $lvl,
        $propertyPath = 'schema' + $lvl + '[' + $i + ']',
        $missingProperty = '\' + "\'" + ' + $propertyPath + ' + "\'" + \'';
      it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
      out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < schema' + ($lvl) + '.length; ' + ($i) + '++) { var ' + ($valid) + ' = ' + ($data) + '[schema' + ($lvl) + '[' + ($i) + ']] !== undefined; if (!' + ($valid) + ') break; }  if (!' + ($valid) + ') {  ';
      if (it.wasTop && $breakOnError) {
        out += ' validate.errors = [ { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
        if (it.opts.verbose) {
          out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
        }
        out += ' }]; return false; ';
      } else {
        out += '  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
        if (it.opts.verbose) {
          out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
        }
        out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; ';
      }
      out += ' } else { ';
    }
  } else {
    if ($schema.length <= 10) {
      var arr2 = $schema;
      if (arr2) {
        var $property, $i = -1,
          l2 = arr2.length - 1;
        while ($i < l2) {
          $property = arr2[$i += 1];
          var $prop = it.util.getProperty($property),
            $missingProperty = it.util.escapeQuotes($prop);
          it.errorPath = it.util.getPath($currentErrorPath, $property, it.opts.jsonPointers);
          out += ' if (' + ($data) + ($prop) + ' === undefined) {  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
          if (it.opts.verbose) {
            out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
          }
          out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } ';
        }
      }
    } else {
      out += '  var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + '; ';
      var $i = 'i' + $lvl,
        $propertyPath = 'schema' + $lvl + '[' + $i + ']',
        $missingProperty = '\' + "\'" + ' + $propertyPath + ' + "\'" + \'';
      it.errorPath = it.util.getPathExpr($currentErrorPath, $propertyPath, it.opts.jsonPointers);
      out += ' for (var ' + ($i) + ' = 0; ' + ($i) + ' < schema' + ($lvl) + '.length; ' + ($i) + '++) { if (' + ($data) + '[schema' + ($lvl) + '[' + ($i) + ']] === undefined) {  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'property ' + ($missingProperty) + ' is required\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }; if (vErrors === null) vErrors = [err]; else vErrors.push(err); errors++; } } ';
    }
  }
  it.errorPath = $currentErrorPath;
  return out;
}
