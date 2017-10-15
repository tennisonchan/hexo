'use strict';

const _port = chrome.runtime.connect({ name: 'popup' });

class Popup {
  constructor() {
    _port.postMessage({ event: 'init' });

    _port.onMessage.addListener(function(data) {
      console.log('onMessage: ', data);
    });

    document.querySelector('.reload').addEventListener('click', function () {
      console.log('hello');
    })
  }
}

window.addEventListener('load', function() {
  window.popup = new Popup();
})