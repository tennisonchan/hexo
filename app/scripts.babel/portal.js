'use strict';

import jquery from 'jquery';
import lodash from 'lodash';
import Mustache from 'mustache';

const methods = ['sayHelloWorld', 'help'];
let eventHandlers = {};

window.$ = jquery.noConflict();
window._ = lodash.noConflict();

class Hexo {
  constructor() {
    console.log('Hexo.init');

    window.addEventListener('message', ({ data }) => {
      if(data.source === 'content') { this.caller(eventHandlers, data) }
    }, false);

    this.postMessage('init');

    methods.forEach((method) => {
      this[method] = this.postMessage.bind(this, method);
    });
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  postMessage (event) {
    let data = Array.from(arguments).slice(1);
    window.postMessage({ source: 'portal', event, data }, window.location.origin);
  }

  template (name, data) {
    let link = document.querySelector('link[rel=import]');
    let template = link.import.querySelector(name).innerHTML;
    Mustache.parse(template);

    return Mustache.render(template, data);
  }
}

eventHandlers.inject = function (tag, attrs, target = document.body) {
  $(`<${tag}/>`, attrs).appendTo(target);
}


window.hexo = new Hexo();
