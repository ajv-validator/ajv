'use strict';
module.exports = function anonymous(it) {
  var out = ' ';
  var $lvl = it.level,
    $dataLvl = it.dataLevel,
    $schema = it.schema['properties'],
    $schemaPath = it.schemaPath + '.' + 'properties',
    $breakOnError = !it.opts.allErrors;
  var $data = 'data' + ($dataLvl || ''),
    $valid = 'valid' + $lvl,
    $errs = 'errs' + $lvl;
  if (it.opts._debug) {
    out += ' console.log(\'Keyword ' + ('properties') + '\'); ';
  }
  var $it = it.util.copy(it),
    $closingBraces = '';
  $it.level++;
  var $dataNxt = $it.dataLevel = it.dataLevel + 1,
    $nextData = 'data' + $dataNxt;
  var $pProperties = it.schema.patternProperties || {},
    $pPropertyKeys = Object.keys($pProperties),
    $aProperties = it.schema.additionalProperties,
    $noAdditional = $aProperties === false,
    $additionalIsSchema = typeof $aProperties == 'object' && Object.keys($aProperties).length,
    $checkAdditional = $noAdditional || $additionalIsSchema;
  out += 'var ' + ($errs) + ' = errors;var valid' + ($it.level) + ' = true;';
  if ($checkAdditional) {
    out += ' var propertiesSchema' + ($lvl) + ' = validate.schema' + ($schemaPath) + ' || {};';
  }
  if ($checkAdditional) {
    out += ' for (var key' + ($lvl) + ' in ' + ($data) + ') { var isAdditional' + ($lvl) + ' = propertiesSchema' + ($lvl) + '[key' + ($lvl) + '] === undefined; ';
    if ($pPropertyKeys.length) {
      out += ' if (isAdditional' + ($lvl) + ') { ';
      var arr1 = $pPropertyKeys;
      if (arr1) {
        var $pProperty, $i = -1,
          l1 = arr1.length - 1;
        while ($i < l1) {
          $pProperty = arr1[$i += 1];
          out += ' if (/' + (it.util.escapeRegExp($pProperty)) + '/.test(key' + ($lvl) + ')) isAdditional' + ($lvl) + ' = false; ';
          if ($i < $pPropertyKeys.length - 1) {
            out += ' else ';
          }
        }
      }
      out += ' } ';
    }
    out += ' if (isAdditional' + ($lvl) + ') { ';
    var $currentErrorPath = it.errorPath;
    it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', '');
    if ($noAdditional) {
      out += ' valid' + ($it.level) + ' = false;  ';
      if (it.wasTop && $breakOnError) {
        out += ' validate.errors = [ { keyword: \'' + ('additionalProperties') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'additional properties NOT allowed\' ';
        if (it.opts.verbose) {
          out += ', schema: false, data: ' + ($data);
        }
        out += ' }]; return false; ';
      } else {
        out += '  var err =   { keyword: \'' + ('additionalProperties') + '\', dataPath: (dataPath || \'\') + ' + (it.errorPath) + ', message: \'additional properties NOT allowed\' ';
        if (it.opts.verbose) {
          out += ', schema: false, data: ' + ($data);
        }
        out += ' }; if (validate.errors === null) validate.errors = [err]; else validate.errors.push(err); errors++; ';
      }
      if ($breakOnError) {
        out += ' break; ';
      }
    } else {
      $it.schema = $aProperties;
      $it.schemaPath = it.schemaPath + '.additionalProperties';
      $it.errorPath = it.errorPath;
      $it.dataPath = it.dataPath + '[key' + $lvl + ']';
      var $passData = $data + '[key' + $lvl + ']';
      var $code = it.validate($it);
      if (it.util.varOccurences($code, $nextData) < 2) {
        out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
      } else {
        out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
      }
      if ($breakOnError) {
        out += ' if (!valid' + ($it.level) + ') break; ';
      }
    }
    it.errorPath = $currentErrorPath;
    out += ' } }  ';
    if ($breakOnError) {
      out += ' if (valid' + ($it.level) + ') { ';
      $closingBraces += '}';
    }
  }
  if ($schema) {
    for (var $propertyKey in $schema) {
      var $sch = $schema[$propertyKey];
      if (it.util.schemaHasRules($sch, it.RULES.all)) {
        $it.schema = $sch;
        $it.schemaPath = $schemaPath + "['" + it.util.escapeQuotes($propertyKey) + "']";
        var $prop = it.util.getProperty($propertyKey),
          $passData = $data + $prop;
        $it.errorPath = (it.errorPath + ' + "' + $prop + '"').replace('" + "', '');
        $it.dataPath = it.dataPath + $prop;
        var $code = it.validate($it);
        if (it.util.varOccurences($code, $nextData) < 2) {
          $code = it.util.varReplace($code, $nextData, $passData);
          var $useData = $passData;
        } else {
          var $useData = $nextData;
          out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ';
        }
        if ($breakOnError) {
          out += ' if (' + ($useData) + ' === undefined) { valid' + ($it.level) + ' = true; } else { ';
        } else {
          out += ' if (' + ($useData) + ' !== undefined) { ';
        }
        out += ' ' + ($code) + ' } ';
      }
      if ($breakOnError) {
        out += ' if (valid' + ($it.level) + ') { ';
        $closingBraces += '}';
      }
    }
  }
  var arr2 = $pPropertyKeys;
  if (arr2) {
    var $pProperty, i2 = -1,
      l2 = arr2.length - 1;
    while (i2 < l2) {
      $pProperty = arr2[i2 += 1];
      var $sch = $pProperties[$pProperty];
      if (it.util.schemaHasRules($sch, it.RULES.all)) {
        $it.schema = $sch;
        $it.schemaPath = it.schemaPath + '.patternProperties' + it.util.getProperty($pProperty);
        out += ' for (var key' + ($lvl) + ' in ' + ($data) + ') { if (/' + (it.util.escapeRegExp($pProperty)) + '/.test(key' + ($lvl) + ')) { ';
        $it.errorPath = (it.errorPath + ' + "[\'" + key' + $lvl + ' + "\']"').replace('" + "', '');
        $it.dataPath = it.dataPath + '[key' + $lvl + ']';
        var $passData = $data + '[key' + $lvl + ']';
        var $code = it.validate($it);
        if (it.util.varOccurences($code, $nextData) < 2) {
          out += ' ' + (it.util.varReplace($code, $nextData, $passData)) + ' ';
        } else {
          out += ' var ' + ($nextData) + ' = ' + ($passData) + '; ' + ($code) + ' ';
        }
        if ($breakOnError) {
          out += ' if (!valid' + ($it.level) + ') break; ';
        }
        out += ' } ';
        if ($breakOnError) {
          out += ' else valid' + ($it.level) + ' = true; ';
        }
        out += ' }  ';
        if ($breakOnError) {
          out += ' if (valid' + ($it.level) + ') { ';
          $closingBraces += '}';
        }
      }
    }
  }
  if ($breakOnError) {
    out += ' ' + ($closingBraces) + ' if (' + ($errs) + ' == errors) {';
  }
  out = it.util.cleanUpCode(out);
  return out;
}
