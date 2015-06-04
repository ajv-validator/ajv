{{# def.definitions }}
{{# def.setup:'maxLength' }}

var valid{{=$lvl}} = data{{=$dataLvl}}.length <= {{=$schema}};

{{# def.checkError:'maxLength' }}
