{{## def.isInteger:
  dataType == 'number' && !(data % 1)
#}}


{{
  var $schema = it.schema.type;
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
          {{?}}
{{?}}


if (!valid) validate.errors.push({
  keyword: 'type',
  dataPath: dataPath,
  message: 'should be {{? $isArray }}{{= $schema.join(",") }}{{??}}{{= $schema }}{{?}}'
  {{? it.opts.verbose }}, schema: {{? $isArray }}validate.schema{{= it.schemaPath + '.type' }}{{??}}'{{= $schema }}'{{?}}, data: data{{?}}
});
