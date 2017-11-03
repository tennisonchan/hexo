'use strict';

import Storage from './storage';
import Mustache from 'mustache';
import { urlTest } from './userScript';

let eventHandlers = {};
const reloadEl = document.querySelector('.reload');
const gistListEl = document.querySelector('.gists-list');
const gistItemEl = document.querySelector('#template-gist-item').innerHTML;

class Popup {
  constructor(storage) {
    this.gistsMap = null;
    this.lastUpdated = null;
    this.port = chrome.runtime.connect({ name: 'popup' });
    this.port.onMessage.addListener(this.caller.bind(this, eventHandlers));

    storage.get({ gistsMap: '{}', lastUpdated: null }).then(this.updateGistList.bind(this));
    storage.onchange(['gistsMap', 'lastUpdated'], this.updateGistList.bind(this));
    reloadEl.addEventListener('click', () => this.port.postMessage({ event: 'reload' }));
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  updateGistList({ gistsMap, lastUpdated }) {
    if (gistsMap) {
      this.gistsMap = JSON.parse(gistsMap);
    }
    if (lastUpdated) {
      this.lastUpdated = lastUpdated;
    }

    this.renderGistList(this.gistsMap, this.lastUpdated);
  }

  renderGistList(gistsMap, lastUpdated) {
    console.log('lastUpdated', lastUpdated);
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      let files = urlTest(gistsMap, tabs[0].url).reduce(function (acc, id) {
        return acc.concat(gistsMap[id].files);
      }, []);
      gistListEl.innerHTML = Mustache.render(gistItemEl, { files, lastUpdated });
    });
  }
}

window.popup = new Popup(new Storage(chrome));
