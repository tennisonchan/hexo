'use strict';

import _ from 'lodash';
import Storage from './storage';
import { urlTest } from './userScript';

const reloadEl = document.querySelector('.reload');
const gistListEl = document.querySelector('.gists-list');
const gistItemEl = document.querySelector('#template-gist-item').innerHTML;

const _port = chrome.runtime.connect({ name: 'popup' });
const eventHandlers = {};

class Popup {
  constructor() {
    _port.onMessage.addListener(function({ event, data }, port) {
      console.log(`onMessage:${event}`, data, port);
      if (typeof eventHandlers[event] === 'function') {
        eventHandlers[event](data);
      }
    });

    reloadEl.addEventListener('click', function () {
      _port.postMessage({ event: 'reload' });
    });

    Storage.get({ gistsMap: '{}', lastUpdated: null }).then(function({ gistsMap, lastUpdated }) {
      let _gistsMap = JSON.parse(gistsMap);
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        let files = urlTest(_gistsMap, tabs[0].url).reduce(function(acc, id) {
          return acc.concat(_gistsMap[id].files);
        }, []);
        eventHandlers.renderGistList({ files, lastUpdated });
      });
    })
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }
}

eventHandlers.renderGistList = function ({ files, lastUpdated }) {
  let gistItemTemp = _.template(gistItemEl);
  gistListEl.innerHTML = gistItemTemp({ files, lastUpdated });
}

window.addEventListener('load', function() {
  window.popup = new Popup();
})