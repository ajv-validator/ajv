{{## def.validateItems:startFrom:
  for (var i = {{= startFrom }}; i < data.length; i++) {
    var _data = data[i]
      , _dataPath = dataPath + '[' + i + ']';

    {{? !it.opts.allErrors }} var valid = {{?}}
      validateItems(_data, _dataPath);

    {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
  }
#}}

function (data, dataPath) {
  'use strict';

  {{? it.opts.allErrors }} var errs = validate.errors.length; {{?}}

  {{? Array.isArray(it.schema) }}
    {{ var $additionalItems = it.parentSchema.additionalItems; }}
    {{? $additionalItems === false }}
      if (data.length > {{= it.schema.length }}) {
        validate.errors.push({
          keyword: 'additionalItems',
          dataPath: dataPath,
          message: 'should NOT have more than {{= it.schema.length }} items'
          {{? it.opts.verbose }}, schema: false, data: data{{?}}
        });

        {{? !it.opts.allErrors }} return false {{?}}
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
            , _dataPath = dataPath + '[{{= $index }}]';

          {{? !it.opts.allErrors }} var valid = {{?}}
            ({{= it.validate($it) }})(_data, _dataPath);

          {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
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

  return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
}
