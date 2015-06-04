{{# def.definitions }}
{{# def.setup:'minLength' }}

var valid{{=$lvl}} = {{# def.strLength }} >= {{=$schema}};

{{# def.checkError:'minLength' }}
