'use strict';

import { matchPatternToRegExp } from './matchPattern';

const allowTypes = ['application/javascript', 'text/css', 'text/html'];

function urlTest(gistsMap, url) {
  return Object.keys(gistsMap).filter(function(key) {
    let { include } = gistsMap[key];

    return include && matchPatternToRegExp(include).test(url);
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
  return allowTypes.indexOf(type) !== -1;
}

function gistTransform (list = []) {
  let gistsMap = {};

  list.forEach(function ({ id, description, files }) {
    let allowFiles = Object.keys(files).filter(name => isAllowType(files[name].type));
    let { include, require } = extractUserScriptParams(description);
    if (include && allowFiles.length) {
      let gist = { include, require };
      gist.files = allowFiles.map(index => {
        let { filename, raw_url } = files[index];
        let url = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');
        let [name, ext] = filename.split('.');

        return { name, ext, url };
      });

      gistsMap[id] = gist;
    }
  })

  return gistsMap;
}

exports = module.exports = { urlTest, gistTransform };