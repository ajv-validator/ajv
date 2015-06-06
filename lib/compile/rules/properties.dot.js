{{# def.definitions }}
{{# def.setup:'properties' }}
{{# def.setupNextLevel }}


{{
  var $dataNxt = $it.dataLevel = it.dataLevel + 1;

  var $pProperties = it.schema.patternProperties || {}
    , $pPropertyKeys = Object.keys($pProperties)
    , $aProperties = it.schema.additionalProperties
    , $noAdditional = $aProperties === false
    , $additionalIsSchema = typeof $aProperties == 'object'
                              && Object.keys($aProperties).length
    , $checkAdditional = $noAdditional || $additionalIsSchema;
}}


var {{=$errs}} = validate.errors.length;
var valid{{=$it.level}} = true;

{{? $checkAdditional }}
  var propertiesSchema{{=$lvl}} = validate.schema{{=$schemaPath}} || {};
{{?}}

{{? $noAdditional }}
  valid{{=$it.level}} = Object.keys({{=$data}}).length <= Object.keys(propertiesSchema{{=$lvl}}).length;
  {{# def.checkError:'additionalProperties' }}
  {{# def.elseIfValid }}
{{?}}

{{? $pPropertyKeys.length }}
  var pPropertiesSchema{{=$lvl}} = validate.schema{{= it.schemaPath + '.patternProperties' }}
    , pPropertiesRegexps{{=$lvl}} = {};

  for (var pProperty{{=$lvl}} in pPropertiesSchema{{=$lvl}})
    pPropertiesRegexps{{=$lvl}}[pProperty{{=$lvl}}] = new RegExp(pProperty{{=$lvl}});
{{?}}


{{? $checkAdditional }}
  for (var key{{=$lvl}} in {{=$data}}) {
    var isAdditional{{=$lvl}} = propertiesSchema{{=$lvl}}[key{{=$lvl}}] === undefined;

    {{? $pPropertyKeys.length }}
      if (isAdditional{{=$lvl}}) {
        for (var pProperty{{=$lvl}} in pPropertiesSchema{{=$lvl}}) {
          var keyMatches{{=$lvl}} = pPropertiesRegexps{{=$lvl}}[pProperty{{=$lvl}}].test(key{{=$lvl}});
          if (keyMatches{{=$lvl}}) {
            isAdditional{{=$lvl}} = false;
            break;
          }
        }
      }
    {{?}}

    if (isAdditional{{=$lvl}}) {        
      {{? $noAdditional }}
        valid{{=$it.level}} = false;
        {{# def.error:'additionalProperties' }}
        {{? $breakOnError }} break; {{?}}
      {{??}}
        {{ /* additionalProperties is schema */
          $it.schema = $aProperties;
          $it.schemaPath = it.schemaPath + '.additionalProperties';
        }}

        var data{{=$dataNxt}} = {{=$data}}[key{{=$lvl}}]
          , dataPath{{=$dataNxt}} = dataPath{{=$dataLvl}} + property(key{{=$lvl}});

        {{ $it.path = it.path + ' + property(key' + $lvl + ')'; }}
        {{= it.validate($it) }};

        {{? $breakOnError }} if (!valid{{=$it.level}}) break; {{?}}
      {{?}}
    }
  }

  {{# def.ifResultValid }}
{{?}}

{{? $schema }}
  {{ for (var $propertyKey in $schema) {  }}
    {{ var $sch = $schema[$propertyKey]; }}

    {{? Object.keys($sch).length }}
      {{
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + "['" + it.escapeQuotes($propertyKey) + "']";
      }}

      {{? $breakOnError }} valid{{=$it.level}} = true; {{?}}

      {{ var $prop = it.property($propertyKey); }}

      var data{{=$dataNxt}} = {{=$data}}{{=$prop}};

      if (data{{=$dataNxt}} !== undefined) {
        var dataPath{{=$dataNxt}} = dataPath{{=$dataLvl}} + "{{=$prop}}";
        {{ $it.path = it.path + ' + "' + $prop + '"'; }}
        {{= it.validate($it) }};
      }
    {{?}}

    {{# def.ifResultValid }}
  {{  }  }}
{{?}}

{{~ $pPropertyKeys:$propertyKey }}
  {{ var $sch = $pProperties[$propertyKey]; }}

  {{? Object.keys($sch).length }}
    {{
      $it.schema = $sch;
      $it.schemaPath = it.schemaPath + '.patternProperties.' + $propertyKey;
    }}

    valid{{=$it.level}} = true;

    for (var key{{=$lvl}} in {{=$data}}) {
      var keyMatches{{=$lvl}} = pPropertiesRegexps{{=$lvl}}['{{= $propertyKey }}'].test(key{{=$lvl}});

      if (keyMatches{{=$lvl}}) {
        var data{{=$dataNxt}} = {{=$data}}[key{{=$lvl}}]
          , dataPath{{=$dataNxt}} = dataPath{{=$dataLvl}} + property(key{{=$lvl}});

        {{ $it.path = it.path + ' + property(key' + $lvl + ')'; }}
        {{= it.validate($it) }};
        {{? $breakOnError }} if (!valid{{=$it.level}}) break; {{?}}
      }
    }

    {{# def.ifResultValid }}
  {{?}}
{{~}}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

var {{=$valid}} = {{=$errs}} == validate.errors.length;

{{# def.cleanUp }}
