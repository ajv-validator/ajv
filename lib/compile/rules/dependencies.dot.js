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

var {{=$errs}} = validate.errors.length;
var {{=$valid}};


{{ for ($property in $propertyDeps) { }}
  if ({{=$data}}['{{= $property }}'] !== undefined) {
    {{ $deps = $propertyDeps[$property]; }}
    {{=$valid}} = {{~ $deps:$dep:$i }}{{?$i}} && {{?}}{{=$data}}['{{= $dep}}'] !== undefined{{~}};
    {{# def.checkError:'dependencies' }}
    {{# def.elseIfValid }}
  }
{{ } }}


{{ for ($property in $schemaDeps) { }}
  {{ var $sch = $schemaDeps[$property]; }}
  {{? Object.keys($sch).length }}
    valid{{=$it.level}} = true;

    if ({{=$data}}['{{= $property }}'] !== undefined) {
      {{ 
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + "['" + it.escapeQuotes($property) + "']";
      }}

      {{= it.validate($it) }}
    }

    {{# def.ifResultValid }}
  {{?}}
{{ } }}

{{? $breakOnError }}{{= $closingBraces }}{{?}}

{{=$valid}} = {{=$errs}} == validate.errors.length;

{{# def.cleanUp }}
