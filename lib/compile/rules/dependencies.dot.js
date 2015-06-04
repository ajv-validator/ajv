{{# def.definitions }}
{{# def.setup:'dependencies' }}
{{# def.setupNextLevel }}


{{
  var $schemaDeps = {}
    , $propertyDeps = {};

  for ($property in $schema) {
    var $sch = $schema[$property];
    var $deps = Array.isArray($sch) ? $propertyDeps : $schemaDeps;
    $deps[$property] = $sch;
  }
}}

var errs{{=$lvl}} = validate.errors.length;
var {{=$valid}};


{{ for ($property in $propertyDeps) { }}
  if ({{=$data}}.hasOwnProperty('{{= $property }}')) {
    {{ $deps = $propertyDeps[$property]; }}
    {{=$valid}} = {{~ $deps:$dep:$i }}{{?$i}} && {{?}}{{=$data}}.hasOwnProperty('{{= $dep}}'){{~}};
    {{# def.checkError:'dependencies' }}
    {{# def.elseIfValid }}
  }
{{ } }}


{{ for ($property in $schemaDeps) { }}
  {{ var $sch = $schemaDeps[$property]; }}
  {{? Object.keys($sch).length }}
    if ({{=$data}}.hasOwnProperty('{{= $property }}')) {
      {{ 
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + '[\'' + it.escapeQuotes($property) + '\']';
      }}

      {{ $it.inline = true; }}
      {{= it.validate($it) }}

      {{=$valid}} = valid{{=$it.level}};
    }

    {{# def.ifValid }}
  {{?}}
{{ } }}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

{{=$valid}} = errs{{=$lvl}} == validate.errors.length;

{{# def.cleanUp }}
