'use strict';
validate = function(data) {
    var dataType = getDataType(data);
    var result = (function(data, dataType, dataPath) {
        'use strict';
        var rule = RULES.not;
        if (!rule.type || rule.type == dataType) {
            var result = (function(data, dataType, dataPath) {
                var result = (function(data, dataType, dataPath) {
                    'use strict';
                    var rule = RULES.type;
                    if (!rule.type || rule.type == dataType) {
                        var result = (function(data, dataType, dataPath) {
                            'use strict';
                            var valid;
                            valid = dataType == 'object';
                            return {
                                valid: valid,
                                errors: valid ? [] : [{
                                    keyword: 'type',
                                    schema: "object",
                                    dataPath: dataPath,
                                    message: 'Type of data' + dataPath + ' is not valid. Expected object'
                                }]
                            };
                        })(data, dataType);
                        if (!result.valid) {
                            return result;
                        }
                    }
                    var rule = RULES.properties;
                    if (!rule.type || rule.type == dataType) {
                        var result = ()(data, dataType);
                        if (!result.valid) {
                            return result;
                        }
                    }
                    return {
                        valid: true,
                        errors: []
                    };
                })(data, dataType, dataPath);
                result.valid = !result.valid;
                result.errors = result.valid ? [] : [{
                    keyword: 'not',
                    schema: {
                        "type": "object",
                        "properties": {
                            "foo": {
                                "type": "string"
                            }
                        }
                    },
                    dataPath: dataPath,
                    message: 'data' + dataPath + ' is valid according to schema, should be NOT valid'
                }];
                return result;
            })(data, dataType);
            if (!result.valid) {
                return result;
            }
        }
        return {
            valid: true,
            errors: []
        };
    })(data, dataType, '');
    return result;
}