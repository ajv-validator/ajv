{{# def.definitions }}
{{# def.setup:'maxProperties' }}

var {{=$valid}} = Object.keys({{=$data}}).length <= {{=$schema}};

{{# def.checkError:'maxProperties' }}
