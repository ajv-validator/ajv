{{# def.definitions }}
{{# def.setup:'maxItems' }}

var {{=$valid}} = {{=$data}}.length <= {{=$schema}};

{{# def.checkError:'maxItems' }}
