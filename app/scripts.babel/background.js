'use strict';

import Gists from 'gists';
import webRequest from './webRequest';
import chromereload from './chromereload';
import Storage from './storage';

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

chrome.browserAction.setBadgeText({ text: '\'Allo' });

console.log('\'Allo \'Allo! Event Page for Browser Action');

chrome.runtime.onInstalled.addListener(details => {
  console.log('previousVersion', details.previousVersion);
});

var Background = function() {
  var _this = {},
      _ports = {};
  let _popupEventHandlers = {};

  function init() {
    console.log('background:init');

    chrome.browserAction.setBadgeText({ text: 'Claws!' });
    chrome.browserAction.setBadgeBackgroundColor({ color: [0, 0, 0, 100] });
    chrome.runtime.onConnect.addListener(onRuntimeConnect);
  }

  function onRuntimeConnect(port) {
    console.log('runtime.onConnect: ', port.name);
    port.postMessage({ message: 'initial connection from background'});

    if(port.name === 'popup'){
      _ports['popup'] = port;
      port.onMessage.addListener(function(data, port) {
        console.log('popup:onMessage:${data.event}', data, port);
        if (data.event && typeof _popupEventHandlers[data.event] === 'function') {
          _popupEventHandlers[data.event](data);
        }
      });
    }

    if(port.name === 'content_scripts') {
      _ports[port.sender.tab.id] = port;
      port.onMessage.addListener(function(data, port) {
        console.log('content:onMessage: ', data);
      });
    }
  }

  _popupEventHandlers.init = function() {
    console.log('popup:init');
    // _this.githubAPI.getGists()
    //   .then(function(response) {
    //     console.log('response', response);
    //   })
  }

  init();

  return _this;
};

window.addEventListener('load', function() {
  Storage.get({ accessToken: null })
    .then(function({ accessToken }) {
      var gists = new Gists({ token: accessToken });
      console.log('gists', gists);
      new Background(gists);
    });
}, false);
