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
    this.readyCallbacks = [];

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

  ready(callback) {
    this.readyCallbacks.push(callback);
    console.log('hexo.ready');
    $(document).trigger('hexo.ready');
  }
}

eventHandlers.inject = function (tag, attrs, target = document.body) {
  let def = $.Deferred();
  let $el = $(`<${tag}/>`, attrs).appendTo(target);

  if (tag === 'script') {
    $(document).on('hexo.ready', function() {
      console.log('load');
      def.resolve();
    })
  } else if (tag === 'link') {
    $el.ready(function() {
      console.log('ready');
      def.resolve();
    })
  }

  return def.promise();
}

eventHandlers.bundle = function (gists = []) {
  let promises = gists.map(file => {
    let { type, raw_url, filename } = file;
    let src = raw_url.replace('gist.githubusercontent.com', 'cdn.rawgit.com');
    if (filename.includes('.js')) {
      return eventHandlers.inject('script', { src });
    } else if (filename.includes('.css')) {
      return eventHandlers.inject('link', { href: src, rel: 'stylesheet' });
    } else if(filename.includes('.html')) {
      let id = filename.replace('.html', '');
      return eventHandlers.inject('link', { href: src, id, rel: 'import' });
    }
  });

  $.when.apply($, promises).then(() => {
    console.log('I\'m ready');
    while (this.readyCallbacks.length) {
      let fn = this.readyCallbacks.shift();
      if ($.isFunction(fn)) {
        fn.call(document, $);
      }
    }
  })
}

window.hexo = new Hexo();
