{{# def.definitions }}
{{# def.setup:'maxLength' }}

if ({{# def.strLength }} > {{=$schema}}) {
  {{# def.error:'maxLength' }}
} {{? $breakOnError }} else { {{?}}