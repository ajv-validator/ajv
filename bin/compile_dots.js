//compile doT templates to js functions

var glob = require('glob')
  , fs = require('fs')
  , path = require('path')
  , doT = require('dot')
  , beautify = require('js-beautify').js_beautify;

var defs = fs.readFileSync(path.join(__dirname, '../lib/dot/definitions.def'));
var files = glob.sync('../lib/dot/*.jst', { cwd: __dirname });

files.forEach(function (f) {
  var template = fs.readFileSync(path.join(__dirname, f));
  var code = doT.compile(template, { definitions: defs });
  code = "'use strict';\nmodule.exports = " + code.toString();
  code = code.replace(/out\s*\+=\s*'\s*';/g, '');
  code = beautify(code, { indent_size: 2 }) + '\n';
  var targetFile = f.replace('../lib/dot', '').replace('.jst', '.js')
    , targetPath = path.join(__dirname, '../lib/dotjs', targetFile);
  fs.writeFileSync(targetPath, code);
  console.log('compiled', targetFile);
});
