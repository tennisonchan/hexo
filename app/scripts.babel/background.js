'use strict';

import Gists from 'gists';
import WebRequest from './webRequest';
import Storage from './storage';
import { gistTransform } from './userScript';
import WebAuthFlow from './webAuthFlow';
import ENV from './env';

let popupEventHandlers = {};
let eventHandlers = {};

class Background {
  constructor({ storage, webRequest }) {
    this.ports = {};
    this.webRequest = webRequest;
    this.storage = storage;
    this.gistsMap = {};
    this.accessToken = null;
    this.lastUpdated = null;

    chrome.runtime.onConnect.addListener(this.onRuntimeConnect.bind(this));
    chrome.runtime.onInstalled.addListener(this.onInstalled.bind(this));
    chrome.tabs.onRemoved.addListener(id => delete this.ports[id]);

    storage.onchange(['accessToken'], ({ accessToken }) => this.accessToken = accessToken);

    this.webRequest.modifyHeader('content-security-policy', function(header) {
      header.value = header.value.split(';').map(function (policy) {
        if (policy.includes('script-src') || policy.includes('style-src') || policy.includes('connect-src')) {
          policy += ' cdn.rawgit.com';
        }
        return policy;
      }).join(';');

      return header;
    });

    storage.get({ accessToken: null, lastUpdated: null, gistsMap: '{}' })
    .then(({ accessToken, lastUpdated, gistsMap }) => {
      this.gistsMap = JSON.parse(gistsMap);
      this.lastUpdated = lastUpdated;
      this.accessToken = accessToken;
    });
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  onRuntimeConnect (port) {
    console.log('runtime.onConnect: ', port.name);

    if (port.name === 'popup') {
      this.ports.popup = port;
      port.onMessage.addListener(this.caller.bind(this, popupEventHandlers));
    } else if (port.name === 'content_scripts') {
      this.ports[port.sender.tab.id] = port;
      port.onMessage.addListener(this.caller.bind(this, eventHandlers));
    }
  }

  onInstalled(details) {
    console.log('previousVersion', details.previousVersion);
    this.storage.get({ accessToken: null })
    .then(({ accessToken }) => {
      if (!accessToken) {
        new WebAuthFlow(chrome, this.storage).launch({
          client_secret: ENV.client_secret
        });
      }
    });
  }
}

popupEventHandlers.reload = function () {
  console.log('popup:reload');
  let opts = {};
  let { gistsMap, lastUpdated, accessToken } = this;
  if (lastUpdated) {
    opts.params = ['since'];
    opts.since = lastUpdated;
  }
  new Gists({ token: accessToken }).all(opts, (_, response) => {
    gistsMap = Object.assign(gistsMap, gistTransform(response));
    console.log('gistsMap', gistsMap);

    this.storage.set({
      gistsMap: JSON.stringify(gistsMap),
      lastUpdated: new Date().toISOString(),
    });
  })
}

eventHandlers.modifyHeader = function () {
  this.webRequest.modifyHeader.apply(this, arguments);
}

window.background = new Background({
  storage: new Storage(chrome),
  webRequest: new WebRequest(chrome)
});
