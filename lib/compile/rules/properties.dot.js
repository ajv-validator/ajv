{{## def.ifValid:
  {{? $breakOnError }}
    if (valid) {
    {{ $closingBraces += '}'; }}
  {{?}}
#}}

{{## def.validateProperty:useKey:
  var data{{=$lvl}} = data[{{= useKey }}]
    , dataPath{{=$lvl}} = dataPath + '.' + {{= useKey }};

  {{? $breakOnError }} var valid = {{?}}
    ({{= it.validate($it) }})(data{{=$lvl}}, dataPath{{=$lvl}});
#}}

{{
  var $it = it.copy(it)
    , $lvl = it.level
    , $breakOnError = !it.opts.allErrors
    , $closingBraces = ''
    , $pProperties = it.schema.patternProperties || {}
    , $pPropertyKeys = Object.keys($pProperties)
    , $aProperties = it.schema.additionalProperties
    , $noAdditional = $aProperties === false
    , $additionalIsSchema = typeof $aProperties == 'object'
                              && Object.keys($aProperties).length
    , $checkAdditional = $noAdditional || $additionalIsSchema;

  $it.level++;
}}

var errs{{=$lvl}} = validate.errors.length;
var valid = true;

{{? $checkAdditional }}
  var propertiesSchema{{=$lvl}} = validate.schema{{= it.schemaPath + '.properties' }} || {};
{{?}}

{{? $noAdditional }}
  var propertiesSchemaKeys{{=$lvl}} = Object.keys(propertiesSchema{{=$lvl}});

  var dataKeys{{=$lvl}} = Object.keys(data);

  var valid = dataKeys{{=$lvl}}.length <= propertiesSchemaKeys{{=$lvl}}.length;
  if (!valid) {
    validate.errors.push({
      keyword: 'properties',
      dataPath: dataPath,
      message: 'additional properties NOT allowed'
      {{? it.opts.verbose }}, schema: propertiesSchema{{=$lvl}}, data: data{{?}}
    });

  }
  {{? $breakOnError }}
    {{ $closingBraces += '}'; }}
    else {
  {{?}}
{{?}}

{{? $pPropertyKeys.length }}
  var pPropertiesSchema{{=$lvl}} = validate.schema{{= it.schemaPath + '.patternProperties' }}
    , pPropertiesRegexps{{=$lvl}} = {};

  for (var pProperty{{=$lvl}} in pPropertiesSchema{{=$lvl}})
    pPropertiesRegexps{{=$lvl}}[pProperty{{=$lvl}}] = new RegExp(pProperty{{=$lvl}});
{{?}}


{{? $checkAdditional }}
  for (var key in data) {
    var isAdditional = !propertiesSchema{{=$lvl}}.hasOwnProperty(key);

    {{? $pPropertyKeys.length }}
      if (isAdditional) {
        for (var pProperty{{=$lvl}} in pPropertiesSchema{{=$lvl}}) {
          var keyMatches = pPropertiesRegexps{{=$lvl}}[pProperty{{=$lvl}}].test(key);
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
          {{? it.opts.verbose }}, schema: propertiesSchema{{=$lvl}}, data: data{{?}}
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

  {{# def.ifValid }}
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
        {{ var $useKey = '"' + $propertyKey + '"'; }}
        {{# def.validateProperty:$useKey }}
      }
    {{?}}

    {{# def.ifValid }}
  {{  }  }}
{{?}}

{{~ $pPropertyKeys:$propertyKey }}
  {{ var $schema = $pProperties[$propertyKey]; }}

  {{? Object.keys($schema).length }}
    {{
      $it.schema = $schema;
      $it.schemaPath = it.schemaPath + '.patternProperties.' + $propertyKey;
    }}

    for (var key{{=$lvl}} in data) {
      var keyMatches = pPropertiesRegexps{{=$lvl}}['{{= $propertyKey }}'].test(key{{=$lvl}});

      if (keyMatches) {
        {{ var $useKey = 'key' + $lvl; }}
        {{# def.validateProperty:$useKey }}
        {{? $breakOnError }} if (!valid) break; {{?}}
      }
    }

    {{# def.ifValid }}
  {{?}}
{{~}}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

var valid = errs{{=$lvl}} == validate.errors.length;

{{ out = out.replace(/if \(valid\) \{\s*\}/g, ''); }}

