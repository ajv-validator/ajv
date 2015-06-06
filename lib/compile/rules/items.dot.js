{{# def.definitions }}
{{# def.setup:'items' }}
{{# def.setupNextLevel }}


{{## def.validateItems:startFrom:
  for (var i{{=$lvl}} = {{=startFrom}}; i{{=$lvl}} < {{=$data}}.length; i{{=$lvl}}++) {
    var data{{=$dataNxt}} = {{=$data}}[i{{=$lvl}}];

    {{ $it.errorPath = (it.errorPath + ' + "[" + i' + $lvl + ' + "]"').replace('" + "', ''); }}
    {{ $it.dataPath = it.dataPath + '[i' + $lvl + ']'; }}
    {{= it.validate($it) }};

    {{? $breakOnError }}
      if (!valid{{=$it.level}}) break;
    {{?}}
  }
#}}

{{ var $dataNxt = $it.dataLevel = it.dataLevel + 1; }}

var {{=$errs}} = validate.errors.length;
var {{=$valid}};

{{? Array.isArray($schema) }}
  {{ /* 'items' is an array of schemas */}}
  {{ var $additionalItems = it.schema.additionalItems; }}
  {{? $additionalItems === false }}
    {{=$valid}} = {{=$data}}.length <= {{= $schema.length }};
    {{# def.checkError:'additionalItems' }}
    {{# def.elseIfValid}}
  {{?}}

  {{~ $schema:$sch:$i }}
    {{? Object.keys($sch).length }}
      valid{{=$it.level}} = true;
      
      if ({{=$data}}.length > {{=$i}}) {
        {{
          $it.schema = $sch;
          $it.schemaPath = $schemaPath + '[' + $i + ']';
        }}

        var data{{=$dataNxt}} = {{=$data}}[{{= $i }}];

        {{ $it.errorPath = (it.errorPath + ' + "[' + $i + ']"').replace('" + "', ''); }}
        {{ $it.dataPath = it.dataPath + '[' + $i + ']'; }}
        {{= it.validate($it) }}
      }

      {{# def.ifResultValid }}
    {{?}}
  {{~}}

  {{? typeof $additionalItems == 'object' && Object.keys($additionalItems).length }}
    {{
      $it.schema = $additionalItems;
      $it.schemaPath = it.schemaPath + '.additionalItems';
    }}
    valid{{=$it.level}} = true;

    if ({{=$data}}.length > {{= $schema.length }}) {
      {{# def.validateItems: $schema.length }}
    }

    {{# def.ifResultValid }}
  {{?}}

{{?? Object.keys($schema).length }}
  {{ /* 'items' is a single schema */}}
  {{
    $it.schema = $schema;
    $it.schemaPath = $schemaPath;
  }}
  {{# def.validateItems: 0 }}
  {{# def.ifResultValid }}
{{?}}

{{? $breakOnError }} {{= $closingBraces }} {{?}}

{{=$valid}} = {{=$errs}} == validate.errors.length;

{{# def.cleanUp }}
