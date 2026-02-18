//compile doT templates to js functions
'use strict';

var glob = require('glob')
  , fs = require('fs')
  , path = require('path')
  , doT = require('dot')
  , beautify = require('js-beautify').js_beautify;

var defsRootPath = process.argv[2] || path.join(__dirname, '../lib');

var defs = {};
var defFiles = glob.sync('./dot/**/*.def', { cwd: defsRootPath });
defFiles.forEach(function (f) {
  var name = path.basename(f, '.def');
  defs[name] = fs.readFileSync(path.join(defsRootPath, f));
});

var filesRootPath = process.argv[3] || path.join(__dirname, '../lib');
var files = glob.sync('./dot/**/*.jst', { cwd: filesRootPath });

var dotjsPath = path.join(filesRootPath, './dotjs');
try { fs.mkdirSync(dotjsPath); } catch(e) {}

console.log('\n\nCompiling:');

var FUNCTION_NAME = /function\s+anonymous\s*\(it[^)]*\)\s*{/;
var OUT_EMPTY_STRING = /out\s*\+=\s*'\s*';/g;
var ISTANBUL = /'(istanbul[^']+)';/g;
var ERROR_KEYWORD = /\$errorKeyword/g;
var ERROR_KEYWORD_STR = ERROR_KEYWORD.source.replace(/^\\\\/, '');
var ERROR_KEYWORD_OR = /\$errorKeyword\s+\|\|/g;
var VARS = [
  '$errs', '$valid', '$lvl', '$data', '$dataLvl',
  '$errorKeyword', '$closingBraces', '$schemaPath',
  '$validate'
];

files.forEach(function (f) {
  var keyword = path.basename(f, '.jst');
  var targetPath = path.join(dotjsPath, keyword + '.js');
  var template = fs.readFileSync(path.join(filesRootPath, f));
  var code = doT.compile(template, defs);
  code = code.toString()
             .replace(OUT_EMPTY_STRING, '')
             .replace(FUNCTION_NAME, 'function generate_' + keyword + '(it, $keyword, $ruleType) {')
             .replace(ISTANBUL, '/* $1 */');
  removeAlwaysFalsyInOr();
  VARS.forEach(removeUnusedVar);
  code = "'use strict';\nmodule.exports = " + code;
  code = beautify(code, { indent_size: 2 }) + '\n';
  fs.writeFileSync(targetPath, code);
  console.log('compiled', keyword);

  function removeUnusedVar(v) {
    var count = 0, idx = 0;
    while ((idx = code.indexOf(v, idx)) !== -1) {
      if (idx + v.length >= code.length || !/[A-Za-z0-9_$]/.test(code[idx + v.length])) count++;
      idx += 1;
    }
    if (count == 1) {
      var vEsc = v.replace(/\$/g, '\\$$');
      var regexp = new RegExp('var\\s+' + vEsc + '\\s*=[^;]*?;|var\\s+' + vEsc + ';');
      code = code.replace(regexp, '');
    }
  }

  function removeAlwaysFalsyInOr() {
    var countUsed = code.split(ERROR_KEYWORD_STR).length - 1;
    var countOr = 0, idx = 0;
    while ((idx = code.indexOf(ERROR_KEYWORD_STR + ' ||', idx)) !== -1) { countOr++; idx += 1; }
    if (countUsed == countOr + 1) code = code.replace(ERROR_KEYWORD_OR, '');
  }
});
