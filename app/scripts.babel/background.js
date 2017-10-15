'use strict';

import Gists from 'gists';
import webRequest from './webRequest';
import Storage from './storage';

let popupEventHandlers = {};
let _ports = {};
let gistsAPI = null;
let _lastUpdate = null;
let _filenames = [];
let _gistsMap = {};

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
        console.log('popup:onMessage:${data.event}', data, port);
        if (data.event && typeof popupEventHandlers[data.event] === 'function') {
          popupEventHandlers[data.event](data);
        }
      });
    }

    if (port.name === 'content_scripts') {
      _ports[port.sender.tab.id] = port;
      port.onMessage.addListener(function(data, port) {
        console.log('content:onMessage: ', data);
      });
    }
  }
}

function transform (list) {
  let filenames = [];
  let gistsMap = {};

  list.forEach(function ({ id, updated_at, description, truncated, files }) {
    Object.keys(files).map(filename => {
      let { raw_url, type } = files[filename];

      if(isAllowType(type)) {
        let key = `${id}/${filename}`;
        filenames.push(key);
        gistsMap[key] = {
          filename, raw_url, type, updated_at
        }
      }
    })
  })

  return { filenames, gistsMap };
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
    _filenames = _filenames.concat(filenames);
    _gistsMap = Object.assign({}, _gistsMap, gistsMap);
    _lastUpdate = new Date().toISOString();

    Storage
      .set({
        filenames: JSON.stringify(_filenames),
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
    _lastUpdate = lastUpdate;
    _gistsMap = gistsMap;
    gistsAPI = new Gists({ token: accessToken });
    new Background({ gistsMap });
  });


chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});