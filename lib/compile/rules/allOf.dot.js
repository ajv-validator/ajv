var valid = true;

{{ var $closingBraces = ''; }}
{{ var $it = it.copy(it); }}

{{~ it.schema.allOf:$schema:$i }}
  {{? !it.opts.allErrors && $i }}
    {{ $closingBraces += '}'; }}
    if (valid) {
  {{?}}

  {{ 
    $it.schema = $schema;
    $it.schemaPath = it.schemaPath + '.allOf[' + $i + ']';
  }}

  valid = valid && ({{= it.validate($it) }})(data, dataPath);
{{~}}

{{= $closingBraces }}
