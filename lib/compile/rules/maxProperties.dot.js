{{# def.definitions }}
{{# def.setup:'maxProperties' }}

var valid = Object.keys(data{{=$dataLvl}}).length <= {{=$schema}};

{{# def.checkError:'maxProperties' }}
