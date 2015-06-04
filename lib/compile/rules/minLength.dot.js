{{# def.definitions }}
{{# def.setup:'minLength' }}

var {{=$valid}} = {{# def.strLength }} >= {{=$schema}};

{{# def.checkError:'minLength' }}
