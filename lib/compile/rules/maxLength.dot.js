{{# def.definitions }}
{{# def.setup:'maxLength' }}

var {{=$valid}} = {{# def.strLength }} <= {{=$schema}};

{{# def.checkError:'maxLength' }}
