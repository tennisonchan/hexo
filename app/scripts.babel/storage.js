'use strict';

let onchangeHandlers = {};
let runtime = chrome.runtime;
let storageArea = chrome.storage.sync;

class Storage {
  constructor() {
    chrome.storage.onChanged.addListener(function (changes) {
      for (let variable in changes) {
        let payload = {};
        let handler = onchangeHandlers[variable];
        payload[variable] = changes[variable].newValue;
        if (typeof handler === 'function') {
          handler(payload)
        }
      }
    });
  }

  onchange (selectors, callback) {
    selectors.forEach(function (selector) {
      onchangeHandlers[selector] = callback;
    });
  }

  set (data) {
    return new Promise(function (resolve, reject) {
      storageArea.set(data, function () {
        if (runtime.lastError) {
          console.error('Error ocurred when setting value');
          reject(data, runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
  }

  get (key) {
    return new Promise(function (resolve, reject) {
      storageArea.get(key, function (data) {
        if (runtime.lastError) {
          console.error('Error ocurred when getting value');
          reject(key, runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
  }

  update (key, updateFunc, callback) {
    callback = callback || function () {};

    return this.get(key).then(function (data) {
      return this.set(updateFunc(data)).then(callback);
    });
  }
}

exports = module.exports = new Storage();