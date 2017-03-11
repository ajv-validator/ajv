'use strict';

var pkg = process.argv[2];
var standalone = process.argv[3];
var compress = process.argv[4];

var fs = require('fs');
var packageDir = __dirname + '/..';
if ('.' !== pkg) packageDir += '/node_modules/' + pkg;

var json = JSON.parse(fs.readFileSync(packageDir + '/package.json', 'utf8'));

var distDir = __dirname + '/../dist';
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);

var browserify = require('browserify');
var bo = {};
if (standalone) bo.standalone = standalone;

var b = browserify(bo);
b.require(packageDir + '/' + json.main, {expose: json.name});
var outputPath = distDir + '/' + json.name + '.bundle.js';

b.bundle().pipe(fs.createWriteStream(outputPath)).on('close', function () {
  var UglifyJS = require('uglify-js');
  var uglifyOpts = {
    warnings: true,
    compress: {},
    output: {
      preamble: '/* ' + json.name + ' ' + json.version + ': ' + json.description + ' */'
    }
  };
  if (compress) {
    var compressOpts = compress.split(',');
    for (var i = 0, l = compressOpts.length; i<l; ++i) {
      var pair = compressOpts[i].split('=');
      uglifyOpts.compress[pair[0]] = pair.length < 1 || 'false' !== pair[1];
    }
  }
  if (standalone) {
    uglifyOpts.outSourceMap = json.name + '.min.js.map';
    uglifyOpts.mangle = {except: [standalone]};
  }

  var result = UglifyJS.minify(distDir + '/' + json.name + '.bundle.js', uglifyOpts);
  fs.writeFileSync(distDir + '/' + json.name + '.min.js', result.code);
  if (result.map) fs.writeFileSync(distDir + '/' + json.name + '.min.js.map', result.map);
  if (!standalone) fs.unlinkSync(distDir + '/' + json.name + '.bundle.js');
});
