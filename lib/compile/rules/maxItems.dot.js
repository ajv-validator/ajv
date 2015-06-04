{{# def.definitions }}
{{# def.setup:'maxItems' }}

var valid{{=$lvl}} = data{{=$dataLvl}}.length <= {{=$schema}};

{{# def.checkErrorLvl:'maxItems' }}
