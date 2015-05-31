function (data, dataPath) {
  var errs = validate.errors.length;

  {{~ it.schema:$schema:$i }}
    {{ 
      var $it = it.copy(it);
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '[' + $i + ']';
    }}

    var valid = ({{= it.validate($it) }})(data, dataPath);

    if (valid) {
      validate.errors.length = errs;
      return true;
    }
  {{~}}

  return false;
}
