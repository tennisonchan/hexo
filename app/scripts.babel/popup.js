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
    })

    Storage.get({ 'filenames': [] }).then(function({ filenames }) {
      renderGistItem(JSON.parse(filenames));
    })
  }
}

function renderGistItem(filenames) {
  let gistItemTemp = _.template(gistItemEl);
  gistListEl.innerHTML = gistItemTemp({ filenames });
}

eventHandlers.reloadCompleted = function ({ filenames }) {
  renderGistItem(filenames);
}

window.addEventListener('load', function() {
  window.popup = new Popup();
})