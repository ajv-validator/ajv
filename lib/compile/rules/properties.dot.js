function (data, dataType, dataPath) {
  'use strict';

  var errors = [];

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
    var propertiesSchema = self.schema{{= it.schemaPath }} || {};
  {{?}}

  {{? $noAdditional }}
    var propertiesSchemaKeys = Object.keys(propertiesSchema);

    var dataKeys = Object.keys(data);

    var notValid = dataKeys.length > propertiesSchemaKeys.length;
    if (notValid) {
      var error = {
        keyword: 'properties',
        schema: propertiesSchema,
        dataPath: dataPath,
        message: 'data' + dataPath + ' is not valid, additional properties NOT allowed'
        {{? it.opts.verbose }}, data: data{{?}}
      };

      {{? it.opts.allErrors }}
        errors.push(error);
      {{??}}
        return { valid: false, errors: [error] };
      {{?}}
    }
  {{?}}

  {{? $pPropertyKeys.length }}
    var pPropertiesSchema = self.schema{{= it.parentSchemaPath + '.patternProperties' }}
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
          var error = {
            keyword: 'properties',
            schema: propertiesSchema,
            dataPath: dataPath,
            message: 'data' + dataPath + ' is not valid, property ' + key + ' NOT allowed'
            {{? it.opts.verbose }}, data: data{{?}}
          };

          {{? it.opts.allErrors }}
            errors.push(error);
          {{??}}
            return { valid: false, errors: [error] };
          {{?}}
        {{??}}
          {{
            /* additionalProperties is schema */
            var $it = it.copy(it);
            $it.schema = $aProperties;
            $it.schemaPath = it.parentSchemaPath + '.additionalProperties';
          }}

          var _data = data[key]
            , _dataType = getDataType(_data)
            , _dataPath = dataPath + '.' + key
            , result = ({{= it._validate($it) }})(_data, _dataType, _dataPath);

          if (!result.valid) {
            {{? it.opts.allErrors }}
              errors.push.apply(errors, result.errors);
            {{??}}
              return result;
            {{?}}
          }
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
        $it.schemaPath = it.schemaPath + '.' + $propertyKey;
      }}

      if (data.hasOwnProperty('{{= $propertyKey }}')) {
        var _data = data['{{= $propertyKey }}']
          , _dataType = getDataType(_data)
          , _dataPath = dataPath + '.{{= $propertyKey }}'
          , result = ({{= it._validate($it) }})(_data, _dataType, _dataPath);

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
          var _data = data[key]
            , _dataType = getDataType(_data)
            , _dataPath = dataPath + '.{{= $propertyKey }}'
            , result = ({{= it._validate($it) }})(_data, _dataType, _dataPath);

          if (!result.valid) {
            {{? it.opts.allErrors }}
              errors.push.apply(errors, result.errors);
            {{??}}
              return result;
            {{?}}
          }
        }
      }
    {{?}}
  {{~}}

  {{? it.opts.allErrors }}
    return { valid: !errors.length, errors: errors };
  {{??}}
    return { valid: true, errors: [] };
  {{?}}
}
