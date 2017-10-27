'use strict';

import Gists from 'gists';
import webRequest from './webRequest';
import Storage from './storage';
import RegExt from './regext';

let popupEventHandlers = {};
let _ports = {};
let gistsAPI = null;
let _lastUpdate = null;
let _filenames = [];
let _gistsMap = {};
let userScriptParams = {};

function isAllowType(type) {
  return ['application/javascript', 'text/css'].indexOf(type) !== -1;
}

class Background {
  constructor() {
    chrome.browserAction.setBadgeText({ text: 'Claws!' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 100] });
    chrome.runtime.onConnect.addListener(this.onRuntimeConnect.bind(this));
  }

  onRuntimeConnect (port) {
    console.log('runtime.onConnect: ', port.name);
    port.postMessage({ message: 'initial connection from background'});

    if (port.name === 'popup'){
      _ports['popup'] = port;
      port.onMessage.addListener(function(data, port) {
        console.log(`popup:onMessage:${data.event}`, data, port);
        if (data.event && typeof popupEventHandlers[data.event] === 'function') {
          popupEventHandlers[data.event](data);
        }
      });
    }

    if (port.name === 'content_scripts') {
      let { url, id } = port.sender.tab;
      _ports[id] = port;

      urlTest(url).forEach(function(key) {
        port.postMessage({ event: 'insert', data: _gistsMap[key] })
      });

      port.onMessage.addListener(function(data, port) {
        console.log('content:onMessage: ', data);
      });
    }
  }
}

function urlTest(url) {
  return _filenames.filter(function(key) {
    let { include } = _gistsMap[key];

    return include && new RegExt(include).test(url);
  });
}

function transform (list) {
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
  if (_lastUpdate) {
    opts.params = ['since'];
    opts.since = _lastUpdate;
  }
  gistsAPI.all(opts, function (_, response) {
    console.log('response', response);

    let { filenames, gistsMap } = transform(response);
    _gistsMap = Object.assign({}, _gistsMap, gistsMap);
    _filenames = Object.keys(_gistsMap);
    _lastUpdate = new Date().toISOString();

    Storage
      .set({
        gistsMap: JSON.stringify(_gistsMap),
        lastUpdate: _lastUpdate,
      })
      .then(() => {
        _ports.popup.postMessage({
          event: 'reloadCompleted',
          data: { filenames: _filenames }
        })
      })
  })
}

Storage.get({ accessToken: null, lastUpdate: null, gistsMap: {} })
  .then(function({ accessToken, lastUpdate, gistsMap }) {
    _gistsMap = JSON.parse(gistsMap);
    _filenames = Object.keys(_gistsMap);
    _lastUpdate = lastUpdate;
    gistsAPI = new Gists({ token: accessToken });
    new Background();
  });


chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});