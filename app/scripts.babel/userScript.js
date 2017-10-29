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

function gistTransform (list) {
  let gistsMap = {};

  list.forEach(function ({ id, updated_at, description, truncated, files }) {
    Object.keys(files).map(filename => {
      let { raw_url, type } = files[filename];

      if (isAllowType(type)) {
        let key = `${id}/${filename}`;
        let { include } = extractUserScriptParams(description);
        gistsMap[key] = {
          filename, raw_url, type, updated_at, include
        }
      }
    })
  })

  return { gistsMap };
}

exports = module.exports = { urlTest, gistTransform };