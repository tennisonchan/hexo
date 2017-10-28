'use strict';

import Gists from 'gists';
import WebRequest from './webRequest';
import Storage from './storage';
import RegExt from './regext';

let popupEventHandlers = {};
let eventHandlers = {};
let _ports = {};
let gistsAPI = null;
let _lastUpdated = null;
let _filenames = [];
let _gistsMap = {};
let userScriptParams = {};

function isAllowType(type) {
  return ['application/javascript', 'text/css'].indexOf(type) !== -1;
}

class Background {
  constructor() {
    chrome.runtime.onConnect.addListener(this.onRuntimeConnect.bind(this));

    this.eventHandlers = eventHandlers;
    this.webRequest = new WebRequest();
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  onRuntimeConnect (port) {
    console.log('runtime.onConnect: ', port.name);
    port.postMessage({ event: 'initial' });

    if (port.name === 'popup') {
      _ports['popup'] = port;
      port.onMessage.addListener(this.caller.bind(this, popupEventHandlers));
    }

    if (port.name === 'content_scripts') {
      let { url, id } = port.sender.tab;
      let loadedFilenames = urlTest(url);
      _ports[id] = port;

      loadedFilenames.forEach(function(key) {
        let { type, raw_url } = _gistsMap[key];
        let src = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');

        if (type.includes('javascript')) {
          port.postMessage({ event: 'inject', data: ['script', { src }] });
        } else if (type.includes('css')) {
          port.postMessage({ event: 'inject', data: ['link', { href: src, rel: 'stylesheet' }] });
        }
      });

      Storage.set({ loadedFilenames: JSON.stringify(loadedFilenames.map(key => _gistsMap[key])) });
      port.onMessage.addListener(this.caller.bind(this, this.eventHandlers));
    }
  }

  reset() {
    Storage
      .set({
        gistsMap: '{}',
        lastUpdated: null,
      });
  }
}

function urlTest(url) {
  return _filenames.filter(function(key) {
    let { include } = _gistsMap[key];

    return include && new RegExt(include).test(url);
  });
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

popupEventHandlers.init = function () {
  console.log('popup:init');
}

popupEventHandlers.reload = function () {
  console.log('popup:reload');
  let opts = {};
  if (_lastUpdated) {
    opts.params = ['since'];
    opts.since = _lastUpdated;
  }
  gistsAPI.all(opts, function (_, response) {
    console.log('response', response);

    let { gistsMap } = gistTransform(response);
    _gistsMap = Object.assign({}, _gistsMap, gistsMap);

    Storage
      .set({
        gistsMap: JSON.stringify(_gistsMap),
        lastUpdated: new Date().toISOString(),
      })
  })
}

eventHandlers.modifyHeaders = function () {
  this.webRequest.registerHandler.apply(this, arguments);
}

eventHandlers.setCookie = function(header) {
  this.webRequest.addHeader(header);
}

Storage.get({ accessToken: null, lastUpdated: null, gistsMap: {} })
  .then(function({ accessToken, lastUpdated, gistsMap }) {
    _gistsMap = JSON.parse(gistsMap);
    _filenames = Object.keys(_gistsMap);
    _lastUpdated = lastUpdated;
    gistsAPI = new Gists({ token: accessToken });
    window.background = new Background();
  });

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});