{{# def.definitions }}
{{# def.setup:'items' }}
{{# def.setupNextLevel }}


{{## def.validateItems:startFrom:
  for (var i = {{= startFrom }}; i < data{{=$dataLvl}}.length; i++) {
    var data{{=$dataNxt}} = data{{=$dataLvl}}[i]
      , dataPath{{=$dataNxt}} = dataPath{{=$dataLvl}} + '[' + i + ']';

    {{ $it.inline = true; }}
    {{= it.validate($it) }};

    {{? $breakOnError }}
      valid{{=$lvl}} = valid{{=$it.level}};
      if (!valid{{=$lvl}}) break;
    {{?}}
  }
#}}

{{ var $dataNxt = $it.dataLevel = it.dataLevel + 1; }}

var errs{{=$lvl}} = validate.errors.length;
var valid{{=$lvl}};

{{? Array.isArray($schema) }}
  {{ /* 'items' is an array of schemas */}}
  {{ var $additionalItems = it.schema.additionalItems; }}
  {{? $additionalItems === false }}
    valid{{=$lvl}} = data{{=$dataLvl}}.length <= {{= $schema.length }};
    {{# def.checkError:'additionalItems' }}
    {{# def.elseIfValid}}
  {{?}}

  {{~ $schema:$sch:$i }}
    {{? Object.keys($sch).length }}
      valid{{=$lvl}} = true;
      
      if (data{{=$dataLvl}}.length > {{=$i}}) {
        {{
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + '[' + $i + ']';
        }}

        var data{{=$dataNxt}} = data{{=$dataLvl}}[{{= $i }}]
          , dataPath{{=$dataNxt}} = dataPath{{=$dataLvl}} + '[{{=$i}}]';

        {{ $it.inline = true; }}
        {{= it.validate($it) }}
        valid{{=$lvl}} = valid{{=$it.level}};
      }

      {{# def.ifValid }}
    {{?}}
  {{~}}

  {{? typeof $additionalItems == 'object' && Object.keys($additionalItems).length }}
    {{
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
    }}

    if (data{{=$dataLvl}}.length > {{= $schema.length }}) {
      {{# def.validateItems: $schema.length }}
    }

    {{# def.ifValid }}
  {{?}}

{{?? Object.keys($schema).length }}
  {{ /* 'items' is a single schema */}}
  {{
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
  }}
  {{# def.validateItems: 0 }}
  {{# def.ifValid }}
{{?}}

{{? $breakOnError }} {{= $closingBraces }} {{?}}

valid{{=$lvl}} = errs{{=$lvl}} == validate.errors.length;

{{# def.cleanUp }}
