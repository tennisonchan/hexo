'use strict';

import $ from 'jquery';

const methods = ['sayHelloWorld', 'help'];
let eventHandlers = {};

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

    this.$ = $;
  }

  caller (handlers, { event, data }) {
    data = data instanceof Array? data : [data];
    typeof handlers[event] === 'function' && handlers[event].apply(this, data);
  }

  postMessage (event, data) {
    window.postMessage({ source: 'portal', event, data }, window.location.origin);
  }
}

eventHandlers.inject = function (tag, attrs, target = document.body) {
  $(`<${tag}/>`, attrs).appendTo(target);
}


window.hexo = new Hexo();
