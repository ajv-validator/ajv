{{# def.definitions }}
{{# def.setup:'maxProperties' }}

if (Object.keys({{=$data}}).length > {{=$schema}}) {
  {{# def.error:'maxProperties' }}
} {{? $breakOnError }} else { {{?}}
