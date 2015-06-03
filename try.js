function(it) {

var $lvl = it.level,
  $dataLvl = it.dataLevel,
  $schema = it.schema['required'],
  $schemaPath = it.schemaPath + '.' + 'required';
if ($schema.length <= 100) {
  out += ' valid = ';
  var arr1 = $schema;
  if (arr1) {
    var $property, $i = -1,
      l1 = arr1.length - 1;
    while ($i < l1) {
      $property = arr1[$i += 1];
      out += ' ';
      if ($i) {
        out += ' && ';
      }
      out += ' data' + ($dataLvl) + '.hasOwnProperty(\'' + (it.escapeQuotes($property)) + '\') ';
    }
  }
  out += ';  if (!valid)   validate.errors.push({ \'required\': \'' + ('required') + '\', dataPath: dataPath' + ($dataLvl) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
  if ($schema.length > 7) {
    out += '...';
  }
  out += ' are required\' ';
  if (it.opts.verbose) {
    out += ', schema: validate.schema' + ($schemaPath) + ', data: data' + ($dataLvl);
  }
  out += ' });';
} else {
  out += ' var errs' + ($lvl) + ' = validate.errors.length; var schema' + ($lvl) + ' = validate.schema' + ($schemaPath) + '; for (var i' + ($lvl) + ' = 0; i' + ($lvl) + ' < schema' + ($lvl) + '.length; i' + ($lvl) + '++) { valid = data.hasOwnProperty(schema' + ($lvl) + '[i' + ($lvl) + ']); if (!valid) {  validate.errors.push({ \'required\': \'' + ('required') + '\', dataPath: dataPath' + ($dataLvl) + ', message: \'properties ' + ($schema.slice(0, 7).join(", "));
  if ($schema.length > 7) {
    out += '...';
  }
  out += ' are required\' ';
  if (it.opts.verbose) {
    out += ', schema: validate.schema' + ($schemaPath) + ', data: data' + ($dataLvl);
  }
  out += ' }); ';
  if (!it.opts.allErrors) {
    out += ' break; ';
  }
  out += ' } } ';
  if (it.opts.allErrors) {
    out += ' valid = errs' + ($lvl) + ' == validate.errors.length; {{}}';
  }
  return out;
}