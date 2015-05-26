{{
  var $schema = it.schema;
  var $isArray = Array.isArray($schema);
  if ($isArray && $schema.length == 1) {
    $schema = $schema[0];
    $isArray = false;
  }
}}

{{? $isArray }}
  {{? $schema.indexOf('integer') >= 0 }}
    valid = {{~ $schema:$t:i }}
              {{? $t != 'integer' }}
                {{? $notFirst }} || {{?}}
                {{ var $notFirst = true; }}
                dataType == '{{=$t}}'
              {{?}}
            {{~}};
    if (!valid) valid = dataType == 'number' && data === parseInt(data);
  {{??}}
    valid = {{~ $schema:$t:i }}
              {{? i }} || {{?}}
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
