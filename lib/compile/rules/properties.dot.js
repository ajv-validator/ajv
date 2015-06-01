{{## def.validateProperty:useKey:
  var _data = data[{{= useKey }}]
    , _dataPath = dataPath + '.' + {{= useKey }};

  {{? $breakOnError }} var valid = {{?}}
    ({{= it.validate($it) }})(_data, _dataPath);
#}}

var properties_errs = validate.errors.length;
var valid = true;

{{
  var $it = it.copy(it)
    , $breakOnError = !it.opts.allErrors
    , $closingBraces = ''
    , $pProperties = it.schema.patternProperties || {}
    , $pPropertyKeys = Object.keys($pProperties)
    , $aProperties = it.schema.additionalProperties
    , $noAdditional = $aProperties === false
    , $additionalIsSchema = typeof $aProperties == 'object'
                              && Object.keys($aProperties).length
    , $checkAdditional = $noAdditional || $additionalIsSchema;
}}

{{? $checkAdditional }}
  var propertiesSchema = validate.schema{{= it.schemaPath + '.properties' }} || {};
{{?}}

{{? $noAdditional }}
  var propertiesSchemaKeys = Object.keys(propertiesSchema);

  var dataKeys = Object.keys(data);

  var valid = dataKeys.length <= propertiesSchemaKeys.length;
  if (!valid) {
    validate.errors.push({
      keyword: 'properties',
      dataPath: dataPath,
      message: 'additional properties NOT allowed'
      {{? it.opts.verbose }}, schema: propertiesSchema, data: data{{?}}
    });

  }
  {{? $breakOnError }}
    {{ $closingBraces += '}'; }}
    else {
  {{?}}
{{?}}

{{? $pPropertyKeys.length }}
  var pPropertiesSchema = validate.schema{{= it.schemaPath + '.patternProperties' }}
    , pPropertiesRegexps = {};

  for (var pProperty in pPropertiesSchema)
    pPropertiesRegexps[pProperty] = new RegExp(pProperty);
{{?}}


{{? $checkAdditional }}
  for (var key in data) {
    var isAdditional = !propertiesSchema.hasOwnProperty(key);

    {{? $pPropertyKeys.length }}
      if (isAdditional) {
        for (var pProperty in pPropertiesSchema) {
          var keyMatches = pPropertiesRegexps[pProperty].test(key);
          if (keyMatches) {
            isAdditional = false;
            break;
          }
        }
      }
    {{?}}

    if (isAdditional) {        
      {{? $noAdditional }}
        valid = false;

        validate.errors.push({
          keyword: 'properties',
          dataPath: dataPath,
          message: 'property ' + key + ' NOT allowed'
          {{? it.opts.verbose }}, schema: propertiesSchema, data: data{{?}}
        });

        {{? $breakOnError }} break; {{?}}
      {{??}}
        {{
          /* additionalProperties is schema */
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
        }}

        {{# def.validateProperty:'key' }}
        {{? $breakOnError }} if (!valid) break; {{?}}
      {{?}}
    }
  }

  {{? $breakOnError }}
    {{ $closingBraces += '}'; }}
    if (valid) {
  {{?}}
{{?}}

{{? it.schema.properties }}
  {{ for (var $propertyKey in it.schema.properties) {  }}
    {{ var $schema = it.schema.properties[$propertyKey]; }}

    {{? Object.keys($schema).length }}
      {{
        $it.schema = $schema;
        $it.schemaPath = it.schemaPath + '.properties["' + it.escapeQuotes($propertyKey) + '"]';
      }}

      {{? $breakOnError }} valid = true; {{?}}
      if (data.hasOwnProperty('{{= $propertyKey }}')) {
        {{ /* TODO cache data types and paths by keys for patternProperties */ }}
        {{ var useKey = '"' + $propertyKey + '"'; }}
        {{# def.validateProperty:useKey }}
      }
    {{?}}

    {{? $breakOnError }}
      {{ $closingBraces += '}'; }}
      if (valid) {
    {{?}}
  {{  }  }}
{{?}}

{{~ $pPropertyKeys:$propertyKey }}
  {{ var $schema = $pProperties[$propertyKey]; }}

  {{? Object.keys($schema).length }}
    {{
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '.patternProperties.' + $propertyKey;
    }}

    for (var key in data) {
      var keyMatches = pPropertiesRegexps['{{= $propertyKey }}'].test(key);

      if (keyMatches) {
        {{# def.validateProperty:'key' }}
        {{? $breakOnError }} if (!valid) break; {{?}}
      }
    }

    {{? $breakOnError }}
      {{ $closingBraces += '}'; }}
      if (valid) {
    {{?}}
  {{?}}
{{~}}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

var valid = properties_errs == validate.errors.length;
