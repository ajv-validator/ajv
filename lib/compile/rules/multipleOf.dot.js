{{# def.definitions }}
{{# def.setup:'multipleOf' }}

var division{{=$lvl}} = {{=$data}} / {{=$schema}};
if ({{=$data}} / {{=$schema}} !== parseInt(division{{=$lvl}})) {
  {{# def.error:'multipleOf' }}
} {{? $breakOnError }} else { {{?}}
