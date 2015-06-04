{{# def.definitions }}
{{# def.setup:'maxProperties' }}

var valid{{=$lvl}} = Object.keys(data{{=$dataLvl}}).length <= {{=$schema}};

{{# def.checkError:'maxProperties' }}
