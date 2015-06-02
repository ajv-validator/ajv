{{## def.ifValid:
  {{? $breakOnError }}
    if (valid) {
    {{ $closingBraces += '}'; }}
  {{?}}
#}}

{{## def.validateItems:startFrom:
  for (var i = {{= startFrom }}; i < data.length; i++) {
    var data{{=$level}} = data[i]
      , dataPath{{=$level}} = dataPath + '[' + i + ']';

    {{? $breakOnError }} valid = {{?}}
      validateItems(data{{=$level}}, dataPath{{=$level}});

    {{? $breakOnError }} if (!valid) break; {{?}}
  }
#}}

{{
  var $it = it.copy(it)
    , $level = it.level
    , $breakOnError = !it.opts.allErrors
    , $closingBraces = ''
    , $itemsSchema = it.schema.items;
  $it.level++;
}}

var errs{{=$level}} = validate.errors.length;
var valid;

{{? Array.isArray($itemsSchema) }}
  {{ var $additionalItems = it.schema.additionalItems; }}
  {{? $additionalItems === false }}
    valid = data.length <= {{= $itemsSchema.length }};
    if (!valid) {
      validate.errors.push({
        keyword: 'additionalItems',
        dataPath: dataPath,
        message: 'should NOT have more than {{= $itemsSchema.length }} items'
        {{? it.opts.verbose }}, schema: false, data: data{{?}}
      });
    }
    {{? $breakOnError }}
      {{ $closingBraces += '}'; }}
      else {
    {{?}}
  {{?}}

  {{~ $itemsSchema:$schema:$index }}
    {{? Object.keys($schema).length }}
      valid = true;
      if (data.length > {{= $index }}) {
        {{
          $it.schema = $schema;
          $it.schemaPath = it.schemaPath + '.items[' + $index + ']';
        }}

        var data{{=$level}} = data[{{= $index }}]
          , dataPath{{=$level}} = dataPath + '[{{= $index }}]';

        {{? $breakOnError }} valid = {{?}}
          ({{= it.validate($it) }})(data{{=$level}}, dataPath{{=$level}});
      }

      {{# def.ifValid }}
    {{?}}
  {{~}}

  {{? typeof $additionalItems == 'object' && Object.keys($additionalItems).length }}
    {{
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
    }}

    if (data.length > {{= $itemsSchema.length }}) {
      var validateItems = ({{= it.validate($it) }});
      {{# def.validateItems: $itemsSchema.length }}
    }

    {{# def.ifValid }}
  {{?}}

{{?? Object.keys($itemsSchema).length }}
  {{
    $it.schema = $itemsSchema;
    $it.schemaPath = it.schemaPath + '.items';
  }}
  var validateItems = ({{= it.validate($it) }});
  {{# def.validateItems: 0 }}

  {{# def.ifValid }}
{{?}}

{{? $breakOnError }} {{= $closingBraces }} {{?}}

valid = errs{{=$level}} == validate.errors.length;

{{ out = out.replace(/if \(valid\) \{\s*\}/g, ''); }}
