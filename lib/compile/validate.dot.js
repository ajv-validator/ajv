{{ /**
    * schema compilation (render) time:
    * it = { schema, RULES, _validate, opts }
    * it.validate - this template function,
    *   it is used recursively to generate code for subschemas
    *
    * runtime:
    * "validate" is a variable name to which this function will be assigned
    * validateRef etc. are defined in the parent scope in index.js
    */ }}

function ( data {{? !it.isRoot }}, dataPath {{?}}) {
  'use strict';

  {{
    var $breakOnErrors = !it.opts.allErrors
      , $closingBraces1 = ''
      , $closingBraces2 = '';
  }}

  {{? it.isRoot }}
    {{
      it.isRoot = false;
      var $level = 0;
      it.level = 1;
    }}
    var dataPath = '';
    var errs{{= $level }} = validate.errors.length = 0;
  {{??}}
    {{ var $level = it.level++; }}
    var errs{{= $level }} = validate.errors.length;
  {{?}}

  var valid = true;

  {{~ it.RULES:$rulesGroup }}
    {{? $shouldUseGroup($rulesGroup) }}
      {{? $rulesGroup.type }}  if ({{= it.checkDataType($rulesGroup.type) }}) {  {{?}}
        {{~ $rulesGroup.rules:$rule }}
          {{? $shouldUseRule($rule) }}
            {{= $rule.code(it) }}
            {{? $breakOnErrors }}
              if (valid) {
              {{ $closingBraces1 += '}'; }}
            {{?}}
          {{?}}
        {{~}}
        {{? $breakOnErrors }}
          {{= $closingBraces1 }}
          {{ $closingBraces1 = ''; }}
        {{?}}
      {{? $rulesGroup.type }}  }  {{?}}

      {{? $breakOnErrors }}
        if (valid) {
        {{ $closingBraces2 += '}'; }}
      {{?}}
    {{?}}
  {{~}}

  {{? $breakOnErrors }} {{= $closingBraces2 }} {{?}}

  return errs{{= $level }} == validate.errors.length;
}

{{
  function $shouldUseGroup($rulesGroup) {
    return $rulesGroup.rules.some(function ($rule) {
      return $shouldUseRule($rule);
    });
  }

  function $shouldUseRule($rule) {
    var $use = it.schema.hasOwnProperty($rule.keyword);
    if (!$use && $rule.keyword == 'properties') {
      var $pProperties = it.schema.patternProperties
        , $aProperties = it.schema.additionalProperties;
      $use = ($pProperties && Object.keys($pProperties).length) ||
             ($aProperties === false || typeof $aProperties == 'object');
    }
    return $use;
  }
}}

{{ out = out.replace(/if \(valid\) \{\s*\}/g, ''); }}

