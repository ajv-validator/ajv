{{## def.isInteger:
  dataType == 'number' &&
    (data === parseInt(data) ||
     data > 9007199254740992 ||
     data < -9007199254740992)
#}}


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
        valid = {{# def.isInteger }};
      }
    {{??}}
      valid = {{~ $schema:$t:$i }}
                {{? $i }} || {{?}}
                dataType == '{{=$t}}'
              {{~}};
    {{?}}
  {{??}}
    valid = {{? $schema == 'integer' }}
              {{# def.isInteger }};
            {{??}}
              dataType == '{{= $schema }}';
            {{?}};
  {{?}}

  return {
    valid: valid,
    errors: valid ? [] : [{
      keyword: 'type',
      schema: {{? $isArray }}self.schema{{= it.schemaPath }}{{??}}'{{= $schema }}'{{?}},
      dataPath: dataPath,
      message: 'should be {{? $isArray }}one of {{= $schema.join(",") }}{{??}}{{= $schema }}{{?}}'
      {{? it.opts.verbose }}, data: data{{?}}
    }]
  };
}
