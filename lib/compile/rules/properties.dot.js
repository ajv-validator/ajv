{{# def.definitions }}
{{# def.setup:'properties' }}
{{# def.setupNextLevel }}


{{
  var $dataNxt = $it.dataLevel = it.dataLevel + 1
    , $nextData = 'data' + $dataNxt;

  var $pProperties = it.schema.patternProperties || {}
    , $pPropertyKeys = Object.keys($pProperties)
    , $aProperties = it.schema.additionalProperties
    , $noAdditional = $aProperties === false
    , $additionalIsSchema = typeof $aProperties == 'object'
                              && Object.keys($aProperties).length
    , $checkAdditional = $noAdditional || $additionalIsSchema;
}}


var {{=$errs}} = errors;
var valid{{=$it.level}} = true;

{{? $checkAdditional }}
  var propertiesSchema{{=$lvl}} = validate.schema{{=$schemaPath}} || {};
{{?}}

{{? $noAdditional && $pPropertyKeys.length === 0 }}
  if (Object.keys({{=$data}}).length > {{= $schema ? Object.keys($schema).length : 0 }}) {
    {{# def.error:'additionalProperties' }}
  } {{# def.elseIfValid }}
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
          $it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', '');
          $it.dataPath = it.dataPath + '[key' + $lvl + ']';
          var $passData = $data + '[key' + $lvl + ']';
        }}

        {{ var $code = it.validate($it); }}
        {{# def.optimizeValidate }}

        {{? $breakOnError }} if (!valid{{=$it.level}}) break; {{?}}
      {{?}}
    }
  }

  {{# def.ifResultValid }}
{{?}}

{{? $schema }}
  {{ for (var $propertyKey in $schema) {  }}
    {{ var $sch = $schema[$propertyKey]; }}

    {{? {{# def.nonEmptySchema:$sch}} }}
      {{
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + "['" + it.util.escapeQuotes($propertyKey) + "']";
        var $prop = it.util.getProperty($propertyKey)
          , $passData = $data + $prop;
        $it.errorPath = (it.errorPath + ' + "' + $prop + '"').replace('" + "', '');
        $it.dataPath = it.dataPath + $prop;
      }}

      {{ var $code = it.validate($it); }}

      {{? {{# def.willOptimize }} }}
        {{
          $code = {{# def._optimizeValidate }};
          var $useData = $passData;
        }}
      {{??}}
        {{ var $useData = $nextData; }}
        var {{=$nextData}} = {{=$passData}};
      {{?}}

      {{? $breakOnError }}
        if ({{=$useData}} === undefined) {
          valid{{=$it.level}} = true;
        } else {
      {{??}}
        if ({{=$useData}} !== undefined) {
      {{?}}
          {{= $code }}
        }
    {{?}} {{ /* def.nonEmptySchema */ }}

    {{# def.ifResultValid }}
  {{  }  }}
{{?}}

{{~ $pPropertyKeys:$pProperty }}
  {{ var $sch = $pProperties[$pProperty]; }}

  {{? {{# def.nonEmptySchema:$sch}} }}
    {{
      $it.schema = $sch;
      $it.schemaPath = it.schemaPath + '.patternProperties.' + $pProperty;
    }}

    for (var key{{=$lvl}} in {{=$data}}) {
      if (/{{= it.util.escapeRegExp($pProperty) }}/.test(key{{=$lvl}})) {
        {{
          $it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', '');
          $it.dataPath = it.dataPath + '[key' + $lvl + ']';
          var $passData = $data + '[key' + $lvl + ']';
        }}

        {{ var $code = it.validate($it); }}
        {{# def.optimizeValidate }}

        {{? $breakOnError }} if (!valid{{=$it.level}}) break; {{?}}
      }
      {{? $breakOnError }} else valid{{=$it.level}} = true; {{?}}
    }

    {{# def.ifResultValid }}
  {{?}} {{ /* def.nonEmptySchema */ }}
{{~}}

{{? $breakOnError }}
  {{= $closingBraces }}
  if ({{=$errs}} == errors) {
{{?}}

{{# def.cleanUp }}
