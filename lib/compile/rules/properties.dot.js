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


{{? $checkAdditional }}
  for (var key{{=$lvl}} in {{=$data}}) {
    var isAdditional{{=$lvl}} = propertiesSchema{{=$lvl}}[key{{=$lvl}}] === undefined;

    {{? $pPropertyKeys.length }}
      if (isAdditional{{=$lvl}}) {
        {{~ $pPropertyKeys:$pProperty:$i }}
          if (/{{= it.util.escapeRegExp($pProperty) }}/.test(key{{=$lvl}}))
            isAdditional{{=$lvl}} = false;
          {{? $i < $pPropertyKeys.length-1 }}
            else
          {{?}}
        {{~}}
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

        var data{{=$dataNxt}} = {{=$data}}[key{{=$lvl}}];

        {{ $it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', ''); }}
        {{ $it.dataPath = it.dataPath + '[key' + $lvl + ']'; }}
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
        $it.schemaPath = $schemaPath + "['" + it.util.escapeQuotes($propertyKey) + "']";
      }}

      {{? $breakOnError }} valid{{=$it.level}} = true; {{?}}

      {{ var $prop = it.util.getProperty($propertyKey); }}

      var data{{=$dataNxt}} = {{=$data}}{{=$prop}};

      if (data{{=$dataNxt}} !== undefined) {
        {{ $it.errorPath = (it.errorPath + ' + "' + $prop + '"').replace('" + "', ''); }}
        {{ $it.dataPath = it.dataPath + $prop; }}
        {{= it.validate($it) }};
      }
    {{?}}

    {{# def.ifResultValid }}
  {{  }  }}
{{?}}

{{~ $pPropertyKeys:$pProperty }}
  {{ var $sch = $pProperties[$pProperty]; }}

  {{? Object.keys($sch).length }}
    {{
      $it.schema = $sch;
      $it.schemaPath = it.schemaPath + '.patternProperties.' + $pProperty;
    }}

    valid{{=$it.level}} = true;

    for (var key{{=$lvl}} in {{=$data}}) {
      if (/{{= it.util.escapeRegExp($pProperty) }}/.test(key{{=$lvl}})) {
        var data{{=$dataNxt}} = {{=$data}}[key{{=$lvl}}];

        {{ $it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', ''); }}
        {{ $it.dataPath = it.dataPath + '[key' + $lvl + ']'; }}
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
