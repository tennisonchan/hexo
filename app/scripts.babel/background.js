'use strict';

import Gists from 'gists';
import WebRequest from './webRequest';
import Storage from './storage';
import { urlTest, gistTransform } from './userScript';
import WebAuthFlow from './webAuthFlow';
import ENV from './env';

let popupEventHandlers = {};
let eventHandlers = {};
let _ports = {};
let gistsAPI = null;
let _lastUpdated = null;
let _filenames = [];
let _gistsMap = {};

class Background {
  constructor() {
    chrome.runtime.onConnect.addListener(this.onRuntimeConnect.bind(this));
    chrome.tabs.onRemoved.addListener(id => delete _ports[id]);

    this.eventHandlers = eventHandlers;
    this.webRequest = new WebRequest();
    this.storage = Storage;
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
      _ports[id] = port;

      urlTest(_gistsMap, url).forEach(function (id) {
        let { files, require } = _gistsMap[id];

        if (require) {
          port.postMessage({ event: 'inject', data: ['script', { src: require }] });
        }

        files.forEach(function (file) {
          let { type, raw_url } = file;
          let url = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');
          if (type.includes('javascript')) {
            port.postMessage({ event: 'inject', data: ['script', { src: url }] });
          } else if (type.includes('css')) {
            port.postMessage({ event: 'inject', data: ['link', { href: url, rel: 'stylesheet' }] });
          }
        })
      });

      port.onMessage.addListener(this.caller.bind(this, this.eventHandlers));
    }
  }
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
    _gistsMap = Object.assign(_gistsMap, gistTransform(response));

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

eventHandlers.setCookie = function(value) {
  this.webRequest.addHeader({ name: 'Set-cookie', value });
}

Storage.onchange(['accessToken'], function(accessToken) {
  gistsAPI = new Gists({ token: accessToken });
});

Storage.get({ accessToken: null, lastUpdated: null, gistsMap: '{}' })
  .then(function({ accessToken, lastUpdated, gistsMap }) {
    _gistsMap = JSON.parse(gistsMap);
    _filenames = Object.keys(_gistsMap);
    _lastUpdated = lastUpdated;
    gistsAPI = new Gists({ token: accessToken });
    window.background = new Background();
  });

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
  new WebAuthFlow(chrome, Storage).launch({
    clientId: ENV.CLIENT_ID,
    scope: 'gist'
  });
});
