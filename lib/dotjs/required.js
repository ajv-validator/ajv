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
  if (it.opts._debug) {
    out += ' console.log(\'Keyword ' + ('required') + '\'); ';
  }
  if ($schema.length <= 100) {
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
        out += ' ' + ($data) + (it.util.getProperty($property)) + ' === undefined ';
      }
    }
    out += ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
      if ($schema.length > 7) {
        out += '...';
      }
      out += ' are required\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
      if ($schema.length > 7) {
        out += '...';
      }
      out += ' are required\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }; if (validate.errors === null) validate.errors = [err]; else validate.errors.push(err); errors++; ';
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  } else {
    out += ' var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + '; for (var i = 0; i < schema' + ($lvl) + '.length; i++) { var ' + ($valid) + ' = data[schema' + ($lvl) + '[i]] !== undefined; if (!' + ($valid) + ') break; }  if (!' + ($valid) + ') {  ';
    if (it.wasTop && $breakOnError) {
      out += ' validate.errors = [ { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
      if ($schema.length > 7) {
        out += '...';
      }
      out += ' are required\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }]; return false; ';
    } else {
      out += '  var err =   { keyword: \'' + ('required') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
      if ($schema.length > 7) {
        out += '...';
      }
      out += ' are required\' ';
      if (it.opts.verbose) {
        out += ', schema: validate.schema' + ($schemaPath) + ', data: ' + ($data);
      }
      out += ' }; if (validate.errors === null) validate.errors = [err]; else validate.errors.push(err); errors++; ';
    }
    out += ' } ';
    if ($breakOnError) {
      out += ' else { ';
    }
  }
  return out;
}
