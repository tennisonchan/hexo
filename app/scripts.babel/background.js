'use strict';

import Gists from 'gists';
import webRequest from './webRequest';
import Storage from './storage';

let _popupEventHandlers = {};
let _ports = {};
let gists = null;

function onRuntimeConnect(port) {
  console.log('runtime.onConnect: ', port.name);
  port.postMessage({ message: 'initial connection from background'});

  if (port.name === 'popup'){
    _ports['popup'] = port;
    port.onMessage.addListener(function(data, port) {
      console.log('popup:onMessage:${data.event}', data, port);
      if (data.event && typeof _popupEventHandlers[data.event] === 'function') {
        _popupEventHandlers[data.event](data);
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

class Background {
  constructor() {
    chrome.browserAction.setBadgeText({ text: 'Claws!' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 100] });
    chrome.runtime.onConnect.addListener(onRuntimeConnect);
  }
}

_popupEventHandlers.init = function () {
  console.log('popup:init');
  gists.all({}, function (response) {
    console.log('response', response);
  })
}

Storage.get({ accessToken: null })
  .then(function({ accessToken }) {
    gists = new Gists({ token: accessToken });
    new Background();
  });


chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});