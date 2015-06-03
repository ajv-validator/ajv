{{# def.definitions }}
{{# def.setup:'maxLength' }}

var valid = data{{=$dataLvl}}.length <= {{=$schema}};

{{# def.checkError:'maxLength' }}
