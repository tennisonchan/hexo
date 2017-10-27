'use strict';

const _port = chrome.runtime.connect({ name: 'content_scripts' });
const eventHandlers = {};

class NorthernBear {
  constructor() {
    this.const = 42;
    console.log('NorthernBear.init');

    _port.postMessage({ message: 'initial connection from content script' });
    _port.onMessage.addListener(function({ event, data }) {
      if (typeof eventHandlers[event] === 'function') {
        eventHandlers[event](data);
      }
    });

    // https://api.github.com/gists?access_token=b478615c5d59a8722b31d4a831ae8c491909ad41
    // bear.insertScript({ src: 'https://gist.githubusercontent.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
    // bear.insertScript({ src: 'https://cdn.rawgit.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
  }
}

eventHandlers.insert = function ({ raw_url, type }) {
  if (type.includes('javascript')) {
    insertScript(raw_url);
  } else if (type.includes('css')) {
    insertStyle(raw_url);
  }
}

function insertStyle (raw_url) {
  console.log('insertStyle', raw_url);
  let el = document.createElement('link');
  if (raw_url) {
    el.rel = 'stylesheet';
    el.href = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');
  }
  document.body.appendChild(el);
}

function insertScript (raw_url) {
  console.log('insertScript', raw_url);
  let el = document.createElement('script');
  if (raw_url) {
    el.type = 'text/javascript';
    el.src = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');;
  }
  document.body.appendChild(el);
}

window.northernBear = new NorthernBear();