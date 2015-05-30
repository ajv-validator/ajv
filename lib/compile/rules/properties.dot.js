{{## def.validateProperty:useKey:
  var _data = data[{{= useKey }}]
    , _dataType = getDataType(_data)
    , _dataPath = dataPath + '.' + {{= useKey }};

  {{? !it.opts.allErrors }} var valid = {{?}}
    ({{= it.validate($it) }})(_data, _dataType, _dataPath);

  {{? !it.opts.allErrors }} if (!valid) return false; {{?}}
#}}

function (data, dataType, dataPath) {
  'use strict';

  var errs = validate.errors.length;

  {{ 
    var $propertyKeys = Object.keys(it.schema || {})
      , $pProperties = it.parentSchema.patternProperties || {}
      , $pPropertyKeys = $pProperties && Object.keys($pProperties)
      , $aProperties = it.parentSchema.additionalProperties;
  }}

  {{ 
    var $noAdditional = $aProperties === false
      , $additionalIsSchema = typeof $aProperties == 'object'
                                && Object.keys($aProperties).length
      , $checkAdditional = $noAdditional || $additionalIsSchema;
  }}

  {{? $checkAdditional }}
    var propertiesSchema = validate.schema{{= it.schemaPath }} || {};
  {{?}}

  {{? $noAdditional }}
    var propertiesSchemaKeys = Object.keys(propertiesSchema);

    var dataKeys = Object.keys(data);

    var notValid = dataKeys.length > propertiesSchemaKeys.length;
    if (notValid) {
      validate.errors.push({
        keyword: 'properties',
        dataPath: dataPath,
        message: 'additional properties NOT allowed'
        {{? it.opts.verbose }}, schema: propertiesSchema, data: data{{?}}
      });

      {{? !it.opts.allErrors }} return false; {{?}}
    }
  {{?}}

  {{? $pPropertyKeys.length }}
    var pPropertiesSchema = validate.schema{{= it.parentSchemaPath + '.patternProperties' }}
      , pPropertiesRegexps = {}
      , dataKeysPPs; /* map of arrays of applicable pattern properties */

    for (var pProperty in pPropertiesSchema)
      pPropertiesRegexps[pProperty] = new RegExp(pProperty);
  {{?}}


  {{? $checkAdditional }}
    {{? $pPropertyKeys.length }}
      dataKeysPPs = {};
    {{?}}

    for (var key in data) {
      var isAdditional = !propertiesSchema.hasOwnProperty(key);

      {{? $pPropertyKeys.length }}
        dataKeysPPs[key] = {};
        for (var pProperty in pPropertiesSchema) {
          var keyMatches = pPropertiesRegexps[pProperty].test(key);
          if (keyMatches) {
            dataKeysPPs[key][pProperty] = true;
            isAdditional = false;
          }
        }
      {{?}}

      if (isAdditional) {
        {{? $noAdditional }}
          validate.errors.push({
            keyword: 'properties',
            dataPath: dataPath,
            message: 'property ' + key + ' NOT allowed'
            {{? it.opts.verbose }}, schema: propertiesSchema, data: data{{?}}
          });

          {{? !it.opts.allErrors }} return false; {{?}}
        {{??}}
          {{
            /* additionalProperties is schema */
            var $it = it.copy(it);
            $it.schema = $aProperties;
            $it.schemaPath = it.parentSchemaPath + '.additionalProperties';
          }}

          {{# def.validateProperty:'key' }}
        {{?}}
      }
    }
  {{?}}

  {{~ $propertyKeys:$propertyKey }}
    {{ var $schema = it.schema[$propertyKey]; }}

    {{? Object.keys($schema).length }}
      {{
        var $it = it.copy(it);
        $it.schema = $schema;
        $it.schemaPath = it.schemaPath + '["' + it.escapeQuotes($propertyKey) + '"]';
      }}

      if (data.hasOwnProperty('{{= $propertyKey }}')) {
        {{ /* TODO cache data types and paths by keys for patternProperties */ }}
        {{ var useKey = '"' + $propertyKey + '"'; }}
        {{# def.validateProperty:useKey }}
      }
    {{?}}
  {{~}}


  {{~ $pPropertyKeys:$propertyKey }}
    {{ var $schema = $pProperties[$propertyKey]; }}

    {{? Object.keys($schema).length }}
      {{
        var $it = it.copy(it);
        $it.schema = $schema;
        $it.schemaPath = it.parentSchemaPath + '.patternProperties.' + $propertyKey;
      }}

      for (var key in data) {
        var keyMatches = {{? $checkAdditional }}
                           dataKeysPPs[key]['{{= $propertyKey }}']
                         {{??}}
                           pPropertiesRegexps['{{= $propertyKey }}'].test(key)
                         {{?}};

        if (keyMatches) {
          {{# def.validateProperty:'key' }} /* TODO cache data types and paths by keys */
        }
      }
    {{?}}
  {{~}}

  return {{? it.opts.allErrors }} errs == validate.errors.length {{??}} true {{?}};
}
