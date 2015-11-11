//compile doT templates to js functions

var glob = require('glob')
  , fs = require('fs')
  , path = require('path')
  , doT = require('dot')
  , beautify = require('js-beautify').js_beautify;

var defs = fs.readFileSync(path.join(__dirname, '../lib/dot/definitions.def'));
var customRule = fs.readFileSync(path.join(__dirname, '../lib/dot/custom.def'));
var files = glob.sync('../lib/dot/*.jst', { cwd: __dirname });

var dotjsPath = path.join(__dirname, '../lib/dotjs');
try { fs.mkdirSync(dotjsPath); } catch(e) {}

console.log('\n\nCompiling:');

var FUNCTION_NAME = /function\s+anonymous\s*\(it[^)]*\)\s*{/;
var OUT_EMPTY_STRING = /out\s*\+=\s*'\s*';/g;

files.forEach(function (f) {
  var keyword = path.basename(f, '.jst');
  var targetPath = path.join(dotjsPath, keyword + '.js');
  var template = fs.readFileSync(path.join(__dirname, f));
  var code = doT.compile(template, { definitions: defs, customRule: customRule });
  code = code.toString()
             .replace(OUT_EMPTY_STRING, '')
             .replace(FUNCTION_NAME, 'function generate_' + keyword + '(it) {');
  code = "'use strict';\nmodule.exports = " + code;
  code = beautify(code, { indent_size: 2 }) + '\n';
  fs.writeFileSync(targetPath, code);
  console.log('compiled', keyword);
});
