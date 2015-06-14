{{# def.definitions }}
{{# def.setup:'enum' }}

{{ var $i = 'i' + $lvl; }}
var enumSchema{{=$lvl}} = validate.schema{{=$schemaPath}}
  , {{=$valid}} = false;

for (var {{=$i}}=0; {{=$i}}<enumSchema{{=$lvl}}.length; {{=$i}}++)
  if (equal({{=$data}}, enumSchema{{=$lvl}}[{{=$i}}])) {
    {{=$valid}} = true;
    break;
  }

{{# def.checkError:'enum' }}

{{? $breakOnError }} else { {{?}}
