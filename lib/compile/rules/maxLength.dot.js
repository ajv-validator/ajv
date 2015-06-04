{{# def.definitions }}
{{# def.setup:'maxLength' }}

var valid{{=$lvl}} = {{# def.strLength }} <= {{=$schema}};

{{# def.checkError:'maxLength' }}
