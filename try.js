'use strict';
validate = function(data, instance) {
    var self = this;
    var dataType = getDataType(data);
    var result = (function(data, dataType, dataPath) {
        'use strict';
        var errors = [];
        var rule = RULES.properties;
        if (!rule.type || rule.type == dataType) {
            var result = (function(data, dataType, dataPath) {
                'use strict';
                var errors = [];
                var propertiesSchema = self.schema.properties;
                var pPropertiesSchema = self.schema.patternProperties,
                    pPropertiesRegexps = {},
                    dataKeysPPs;
                for (var pProperty in pPropertiesSchema) pPropertiesRegexps[pProperty] = new RegExp(pProperty);
                dataKeysPPs = {};
                for (var key in data) {
                    var isAdditional = !propertiesSchema.hasOwnProperty(key);
                    dataKeysPPs[key] = {};
                    for (var pProperty in pPropertiesSchema) {
                        var keyMatches = pPropertiesRegexps[pProperty].test(key);
                        if (keyMatches) {
                            dataKeysPPs[key][pProperty] = true;
                            isAdditional = false;
                        }
                    }
                    if (isAdditional) {
                        var _data = data[key],
                            _dataType = getDataType(_data),
                            _dataPath = dataPath + '.' + key,
                            result = (function(data, dataType, dataPath) {
                                'use strict';
                                var errors = [];
                                var rule = RULES.type;
                                if (!rule.type || rule.type == dataType) {
                                    var result = (function(data, dataType, dataPath) {
                                        'use strict';
                                        var valid;
                                        valid = dataType == 'number' && data === parseInt(data);
                                        return {
                                            valid: valid,
                                            errors: valid ? [] : [{
                                                keyword: 'type',
                                                schema: 'integer',
                                                dataPath: dataPath,
                                                message: 'data' + dataPath + ' is not valid. Expected integer',
                                                data: data
                                            }]
                                        };
                                    })(data, dataType, dataPath);
                                    if (!result.valid) {
                                        errors.push.apply(errors, result.errors);
                                    }
                                }
                                return {
                                    valid: !errors.length,
                                    errors: errors
                                };
                            })(_data, _dataType, _dataPath);
                        if (!result.valid) {
                            errors.push.apply(errors, result.errors);
                        }
                    }
                }
                if (data.hasOwnProperty('foo')) {
                    var _data = data['foo'],
                        _dataType = getDataType(_data),
                        _dataPath = dataPath + '.foo',
                        result = (function(data, dataType, dataPath) {
                            'use strict';
                            var errors = [];
                            var rule = RULES.type;
                            if (!rule.type || rule.type == dataType) {
                                var result = (function(data, dataType, dataPath) {
                                    'use strict';
                                    var valid;
                                    valid = dataType == 'array';
                                    return {
                                        valid: valid,
                                        errors: valid ? [] : [{
                                            keyword: 'type',
                                            schema: 'array',
                                            dataPath: dataPath,
                                            message: 'data' + dataPath + ' is not valid. Expected array',
                                            data: data
                                        }]
                                    };
                                })(data, dataType, dataPath);
                                if (!result.valid) {
                                    errors.push.apply(errors, result.errors);
                                }
                            }
                            var rule = RULES.maxItems;
                            if (!rule.type || rule.type == dataType) {
                                var result = (function(data, dataType, dataPath) {
                                    'use strict';
                                    var valid = data.length <= 3;
                                    return {
                                        valid: valid,
                                        errors: valid ? [] : [{
                                            keyword: 'maxItems',
                                            schema: 3,
                                            dataPath: dataPath,
                                            message: 'data' + dataPath + ' is not valid, should NOT have more than 3 items',
                                            data: data
                                        }]
                                    };
                                })(data, dataType, dataPath);
                                if (!result.valid) {
                                    errors.push.apply(errors, result.errors);
                                }
                            }
                            return {
                                valid: !errors.length,
                                errors: errors
                            };
                        })(_data, _dataType, _dataPath);
                    if (!result.valid) {
                        errors.push.apply(errors, result.errors);
                    }
                }
                if (data.hasOwnProperty('bar')) {
                    var _data = data['bar'],
                        _dataType = getDataType(_data),
                        _dataPath = dataPath + '.bar',
                        result = (function(data, dataType, dataPath) {
                            'use strict';
                            var errors = [];
                            var rule = RULES.type;
                            if (!rule.type || rule.type == dataType) {
                                var result = (function(data, dataType, dataPath) {
                                    'use strict';
                                    var valid;
                                    valid = dataType == 'array';
                                    return {
                                        valid: valid,
                                        errors: valid ? [] : [{
                                            keyword: 'type',
                                            schema: 'array',
                                            dataPath: dataPath,
                                            message: 'data' + dataPath + ' is not valid. Expected array',
                                            data: data
                                        }]
                                    };
                                })(data, dataType, dataPath);
                                if (!result.valid) {
                                    errors.push.apply(errors, result.errors);
                                }
                            }
                            return {
                                valid: !errors.length,
                                errors: errors
                            };
                        })(_data, _dataType, _dataPath);
                    if (!result.valid) {
                        errors.push.apply(errors, result.errors);
                    }
                }
                for (var key in data) {
                    var keyMatches = dataKeysPPs[key]['f.o'];
                    if (keyMatches) {
                        var _data = data['f.o'],
                            _dataType = getDataType(_data),
                            _dataPath = dataPath + '.f.o',
                            result = (function(data, dataType, dataPath) {
                                'use strict';
                                var errors = [];
                                var rule = RULES.minItems;
                                if (!rule.type || rule.type == dataType) {
                                    var result = (function(data, dataType, dataPath) {
                                        'use strict';
                                        var valid = data.length >= 2;
                                        return {
                                            valid: valid,
                                            errors: valid ? [] : [{
                                                keyword: 'minItems',
                                                schema: 2,
                                                dataPath: dataPath,
                                                message: 'data' + dataPath + ' is not valid, should NOT have less than 2 items',
                                                data: data
                                            }]
                                        };
                                    })(data, dataType, dataPath);
                                    if (!result.valid) {
                                        errors.push.apply(errors, result.errors);
                                    }
                                }
                                return {
                                    valid: !errors.length,
                                    errors: errors
                                };
                            })(_data, _dataType, _dataPath);
                        if (!result.valid) {
                            errors.push.apply(errors, result.errors);
                        }
                    }
                }
                return {
                    valid: !errors.length,
                    errors: errors
                };
            })(data, dataType, dataPath);
            if (!result.valid) {
                errors.push.apply(errors, result.errors);
            }
        }
        return {
            valid: !errors.length,
            errors: errors
        };
    })(data, dataType, '');
    return result;
}
