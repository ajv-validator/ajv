{{# def.definitions }}
{{# def.setup:'maxItems' }}

var valid = data{{=$dataLvl}}.length <= {{=$schema}};

{{# def.checkError:'maxItems' }}
