'use strict';

import Storage from './storage';
import { urlTest } from './userScript';

const _port = chrome.runtime.connect({ name: 'content' });
const eventHandlers = {};
const storage = new Storage(chrome);

class ContentScript {
  constructor(gistsMap) {
    console.log('ContentScript.init');
    this.gistsMap = gistsMap;

    inject('script', { src: chrome.extension.getURL('scripts/portal.js') });

    _port.onMessage.addListener(this.caller.bind(this, eventHandlers));
    window.addEventListener('message', ({ data }) => {
      if(data.source === 'portal') { this.caller(eventHandlers, data) }
    }, false);
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  postMessage (event, data) {
    window.postMessage({ source: 'content', event, data }, window.location.origin);
  }
}

eventHandlers.init = function () {
  urlTest(this.gistsMap, window.location.href)
  .forEach(id => {
    let { files } = this.gistsMap[id];

    files.forEach(file => {
      let { type, raw_url } = file;
      let href = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');
      if (type.includes('javascript')) {
        this.postMessage('inject', ['script', { src: href }]);
      } else if (type.includes('css')) {
        this.postMessage('inject', ['link', { href, rel: 'stylesheet' }]);
      }
    })
  });
}

function inject (tag, attrs, target) {
  let el = document.createElement(tag);
  let addAttrs = function addAttrs (el, attrs) {
    for (let key in attrs) {
      let value = attrs[key];
      if (typeof value === 'object') {
        addAttrs(el[key], value);
      } else {
        el[key] = value;
      }
    }
  }

  addAttrs(el, attrs);

  (target || document.body).appendChild(el);
}

eventHandlers.sayHelloWorld = function(data) {
  console.log('HelloWorld', data);
}

eventHandlers.help = function() {
  console.log('help manual');
}

storage.get({ gistsMap: '{}' })
  .then(function ({ gistsMap }) {
    new ContentScript(JSON.parse(gistsMap));
  });
