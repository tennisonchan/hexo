'use strict';

const source = 'portal';
const origin = window.location.origin;
const methods = JSON.parse(document.currentScript.dataset.methods || {});

let postMessage = function (event, data) {
  window.postMessage({ source, event, data }, origin);
}

class Hexo {
  constructor() {
    console.log('Hexo.init');
    methods.forEach((method) => {
      this[method] = postMessage.bind(this, method);
    });
  }
}

window.hexo = new Hexo();