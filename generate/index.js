#! /usr/bin/env node
'use strict';

var fs = require('fs');
var path = require('path');

var config = JSON.parse(fs.readFileSync('site.json'));

config.pages.forEach(createPage);
if (config.navigation) generateNavigation();

function createPage(page) {
  readFile(page);
  replaceLinks(page);
  addFrontMatter(page);
  writePage(page);
}

function generateNavigation() {
  try { fs.mkdirSync(config.folders.includes); } catch (e) {}
  var navHtml = renderNavHtml(config.navigation);
  var navPath = path.join(config.folders.includes, 'nav.html');
  fs.writeFileSync(navPath, navHtml);
}

function readFile(page) {
  var sourcePath = path.join(config.folders.source, page.file);
  page.content = fs.readFileSync(sourcePath, 'utf8');
}

var rootRegex;
function replaceLinks(page) {
  config.pages.forEach(replaceLinksToPage);
  replaceLinksToRoot();

  function replaceLinksToPage(toPage) {
    page.content = page.content.replace(regExpG(config.repository + '/blob/master/' + toPage.file), toPage.page + '.html')
                               .replace(regExpG(toPage.file), toPage.page + '.html')
                               .replace(regExpG('./' + path.basename(toPage.file)), './' + path.basename(toPage.page) + '.html')
                               .replace(/\(\.\.\/spec\//g, `(${config.repository}/tree/master/spec/`);
  }

  function replaceLinksToRoot() {
    rootRegex = rootRegex || new RegExp(config.repository + '(?:\\/)?#', 'g');
    page.content = page.content.replace(rootRegex, '/' + config.folders.site + '#');
  }
}

function regExpG(str) {
  return new RegExp(escapePath(str), 'g')
}

function addFrontMatter(page) {
  page.content = frontMatter({config, page}) + page.content;
}

function frontMatter({config: {layout}, page: {page, title}}) {
  return `---
page_name: ${page}
title: ${title}
layout: ${layout}
---
`
}

function renderNavHtml(navigation) {
  let html = '<ul id="page_links">'
  for (const nav of navigation) {
    html +=`
      <li>
        {% if page.page_name == '${nav.page}' %}
          <span class="current_page">${nav.linkText}</span>
        {% else %}
          <a href="${nav.home ? "/" : `${nav.page}.html`}" title="${nav.linkText}">${nav.linkText}</a>
        {% endif %}
      </li>
`
  }
  return html + "</ul>"
}

function writePage(page) {
  var targetPath = path.join(config.folders.target, page.page + '.md');
  var dir = path.dirname(page.page)
  try { fs.mkdirSync(dir); } catch (e) {}
  fs.writeFileSync(targetPath, page.content);
}

function escapePath(str) {
  return str.replace(/(\/|\.)/g, '\\$1');
}
