function (data, dataType, dataPath) {
  'use strict';

  {{
    var $schema = it.schema;
    var $isArray = Array.isArray($schema);
    if ($isArray && $schema.length == 1) {
      $schema = $schema[0];
      $isArray = false;
    }
  }}

  var valid;
  {{? $isArray }}
    {{? $schema.indexOf('integer') >= 0 }}
      valid = {{~ $schema:$t }}
                {{? $t != 'integer' }}
                  {{? $notFirst }} || {{?}}
                  {{ var $notFirst = true; }}
                  dataType == '{{=$t}}'
                {{?}}
              {{~}};
      if (!valid) {
        valid = dataType == 'number' && data === parseInt(data);
      }
    {{??}}
      valid = {{~ $schema:$t:$i }}
                {{? $i }} || {{?}}
                dataType == '{{=$t}}'
              {{~}};
    {{?}}
  {{??}}
    valid = dataType == {{? $schema == 'integer' }}
                          'number' && data === parseInt(data)
                        {{??}}
                          '{{= $schema }}'
                        {{?}};
  {{?}}

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'type',
      schema: {{? $isArray }}self.schema{{= it.schemaPath }}{{??}}'{{= $schema }}'{{?}},
      dataPath: dataPath,
      message: 'data' + dataPath + ' is not valid. Expected {{? $isArray }}{{= $schema.join(",") }}{{??}}{{= $schema }}{{?}}'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
