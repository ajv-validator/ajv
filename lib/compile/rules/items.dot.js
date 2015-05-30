{{## def.validateItems:startFrom:
  for (var i = {{= startFrom }}; i < data.length; i++) {
    var _data = data[i]
      , _dataType = getDataType(_data)
      , _dataPath = dataPath + '[' + i + ']'
      , result = validateItems(_data, _dataType, _dataPath);

    if (!result.valid) {
      {{? it.opts.allErrors }}
        errors.push.apply(errors, result.errors);
      {{??}}
        return result;
      {{?}}
    }
  }
#}}

function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

  {{? Array.isArray(it.schema) }}
    {{ var $additionalItems = it.parentSchema.additionalItems; }}
    {{? $additionalItems === false }}
      if (data.length > {{= it.schema.length }}) {
        errors.push({
          keyword: 'additionalItems',
          schema: false,
          dataPath: dataPath,
          message: 'should NOT have more than {{= it.schema.length }} items'
          {{? it.opts.verbose }}, data: data{{?}}
        });

        {{? !it.opts.allErrors }}
          return { valid: false, errors: errors };
        {{?}}
      }
    {{?}}

    {{~ it.schema:$schema:$index }}
      {{? Object.keys($schema).length }}
        if (data.length > {{= $index }}) {
          {{
            var $it = it.copy(it);
            $it.schema = $schema;
            $it.schemaPath = it.schemaPath + '[' + $index + ']';
          }}

          var _data = data[{{= $index }}]
            , _dataType = getDataType(_data)
            , _dataPath = dataPath + '[{{= $index }}]'
            , result = ({{= it.validate($it) }})(_data, _dataType, _dataPath);

          if (!result.valid) {
            {{? it.opts.allErrors }}
              errors.push.apply(errors, result.errors);
            {{??}}
              return result;
            {{?}}
          }
        }
      {{?}}
    {{~}}

    {{? typeof $additionalItems == 'object' && Object.keys($additionalItems).length }}
      {{
        var $it = it.copy(it);
        $it.schema = $additionalItems;
        $it.schemaPath = it.parentSchemaPath + '.additionalItems';
      }}

      if (data.length > {{= it.schema.length }}) {
        var validateItems = ({{= it.validate($it) }});
        {{# def.validateItems: it.schema.length }}
      }
    {{?}}
  {{?? Object.keys(it.schema).length }}
    var validateItems = ({{= it.validate(it) }});
    {{# def.validateItems: 0 }}
  {{?}}

  {{? it.opts.allErrors }}
    return { valid: !errors.length, errors: errors };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
