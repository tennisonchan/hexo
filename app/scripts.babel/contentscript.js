'use strict';

const _port = chrome.runtime.connect({ name: 'content_scripts' });
const eventHandlers = {};

class ContentScript {
  constructor() {
    console.log('ContentScript.init');

    _port.postMessage({ message: 'initial connection from content script' });
    _port.onMessage.addListener(this.caller.bind(this, eventHandlers));

    window.addEventListener('message', ({ data }) => {
      if(data.source === 'portal') { this.caller(eventHandlers, data) }
    }, false);

    eventHandlers.inject('script', {
      src: chrome.extension.getURL('scripts/portal.js'),
      dataset: { methods: JSON.stringify(Object.keys(eventHandlers)) }
    });
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }
}

eventHandlers.setCookie = function(header) {
  _port.postMessage({ event: 'setCookie', data: header });
}

eventHandlers.inject = function (tag, attrs, target) {
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

new ContentScript();