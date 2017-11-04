'use strict';

import jquery from 'jquery';
import lodash from 'lodash';
import Mustache from 'mustache';

const methods = ['sayHelloWorld', 'help'];
let handlers = {};

window.$ = jquery.noConflict();
window._ = lodash.noConflict();

class Hexo {
  constructor() {
    console.log('Hexo.init');
    this.readyCallbacks = [];

    window.addEventListener('message', ({ data }) => {
      if(data.source === 'content') { this.caller(handlers, data) }
    }, false);

    methods.forEach((method) => {
      this[method] = this.postMessage.bind(this, method);
    });
  }

  caller (fn, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof fn[event] === 'function' && fn[event].apply(this, data);
  }

  postMessage (event) {
    let data = Array.from(arguments).slice(1);
    window.postMessage({ source: 'portal', event, data }, window.location.origin);
  }

  template (name) {
    let link = document.querySelector('link[rel=import]');
    let template = link.import.querySelector(name).innerHTML;
    Mustache.parse(template);

    return function (data) {
      return Mustache.render(template, data);
    }
  }

  ready (callback) {
    this.readyCallbacks.push(callback);
  }
}

handlers.executeReady = function() {
  this.readyCallbacks.forEach(fn => typeof fn === 'function' && fn.call(this, $));
}

window.hexo = new Hexo();
