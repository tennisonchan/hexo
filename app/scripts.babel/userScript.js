'use strict';

import RegExt from './regext';

function urlTest(gistsMap, url) {
  return Object.keys(gistsMap).filter(function(key) {
    let { include } = gistsMap[key];

    return include && new RegExt(include).test(url);
  });
}

function extractUserScriptParams(str) {
  let regex = /@(\w+)\s([^;]+);/g;
  let map = {};
  let arr;

  while(arr = regex.exec(str)){
    let key = arr[1];
    let value = arr[2];

    map[key] = value;
  }

  return map;
}

function isAllowType(type) {
  return ['application/javascript', 'text/css'].indexOf(type) !== -1;
}

function gistTransform (list = []) {
  let gistsMap = {};

  list.forEach(function ({ id, description, files }) {
    let allowFiles = Object.keys(files).filter(name => isAllowType(files[name].type));
    let { include, require } = extractUserScriptParams(description);
    if (include && allowFiles.length) {
      let gist = {};
      gist.include = include;
      gist.require = require;
      gist.files = allowFiles.map(name => {
        let { filename, raw_url, type } = files[name];
        return { filename, raw_url, type }
      });

      gistsMap[id] = gist;
    }
  })

  return gistsMap;
}

exports = module.exports = { urlTest, gistTransform };