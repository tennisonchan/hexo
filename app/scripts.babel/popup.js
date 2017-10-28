'use strict';

import _ from 'lodash';
import Storage from './storage';

const reloadEl = document.querySelector('.reload');
const gistListEl = document.querySelector('.gists-list');
const gistItemEl = document.querySelector('#template-gist-item').innerHTML;

const _port = chrome.runtime.connect({ name: 'popup' });
const eventHandlers = {};

class Popup {
  constructor() {
    _port.postMessage({ event: 'init' });
    _port.onMessage.addListener(function({ event, data }, port) {
      console.log(`onMessage:${event}`, data, port);
      if (typeof eventHandlers[event] === 'function') {
        eventHandlers[event](data);
      }
    });

    reloadEl.addEventListener('click', function () {
      _port.postMessage({ event: 'reload' });
    });

    Storage.get({ 'loadedFilenames': [], lastUpdated: null }).then(function({ loadedFilenames, lastUpdated }) {
      eventHandlers.renderGistList({ loadedFilenames: JSON.parse(loadedFilenames), lastUpdated });
    })
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  reset() {
    Storage.set({ 'loadedFilenames': '[]' });
  }
}

eventHandlers.renderGistList = function ({ loadedFilenames, lastUpdated }) {
  let gistItemTemp = _.template(gistItemEl);
  gistListEl.innerHTML = gistItemTemp({ loadedFilenames, lastUpdated });
}

window.addEventListener('load', function() {
  window.popup = new Popup();
})