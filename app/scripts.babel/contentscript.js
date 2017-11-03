'use strict';

import Storage from './storage';
import { urlTest } from './userScript';

const _port = chrome.runtime.connect({ name: 'content' });
const handlers = {};
const storage = new Storage(chrome);
const portalUrl = chrome.extension.getURL('scripts/portal.js');

class ContentScript {
  constructor(gistsMap) {
    console.log('ContentScript.init');
    this.gistsMap = gistsMap;

    inject('script', { src: portalUrl })
      .then(() => this.loadGists(gistsMap))
      .then(() => this.postMessage('executeReady'));

    _port.onMessage.addListener(this.caller.bind(this, handlers));
    window.addEventListener('message', ({ data }) => {
      if(data.source === 'portal') { this.caller(handlers, data) }
    }, false);
  }

  caller (fn, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof fn[event] === 'function' && fn[event].apply(this, data);
  }

  postMessage (event, data) {
    window.postMessage({ source: 'content', event, data }, window.location.origin);
  }

  loadGists(gistsMap) {
    let gists = urlTest(gistsMap, window.location.href)
      .reduce((acc, id) => {
        let { files } = gistsMap[id];
        return acc.concat(files);
      }, []);

    let promises = gists.map((file) => inject.apply(this, getArguments(file)));
    return Promise.all(promises);
  }
}

function getArguments ({ url, name, ext }){
  ext = ext || url.substr(url.lastIndexOf('.') + 1);
  return ({
    js: ['script', { src: url }],
    css: ['link', { href: url, rel: 'stylesheet' }],
    html: ['link', { href: url, id: name, rel: 'import' }]
  })[ext];
}

function inject (tag = 'script', attrs = {}, target = document.body) {
  return new Promise(function (resolve, reject) {
    const el = document.createElement(tag);
    attrs.async = true;
    let addAttrs = function addAttrs (el, props) {
      for (let key in props) {
        let value = props[key];
        if (typeof value === 'object') {
          addAttrs(el[key], value);
        } else {
          el[key] = value;
        }
      }
    }

    addAttrs(el, attrs);

    el.addEventListener('load', resolve);
    el.addEventListener('error', reject);
    target.appendChild(el);
  });
}

handlers.inject = inject;

handlers.sayHelloWorld = function(data) {
  console.log('HelloWorld', data);
}

handlers.help = function() {
  console.log('help manual');
}

storage.get({ gistsMap: '{}' })
  .then(function ({ gistsMap }) {
    new ContentScript(JSON.parse(gistsMap));
  });
