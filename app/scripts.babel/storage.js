'use strict';

class Storage {
  constructor({ runtime, storage }) {
    this.onchangeHandlers = {};
    this.runtime = runtime;
    this.storageArea = storage.sync;

    storage.onChanged.addListener(changes => {
      for (let variable in changes) {
        let payload = {};
        let handler = this.onchangeHandlers[variable];
        payload[variable] = changes[variable].newValue;
        if (typeof handler === 'function') {
          handler(payload);
        }
      }
    });
  }

  onchange (selectors, callback) {
    selectors.forEach(selector => {
      this.onchangeHandlers[selector] = callback;
    });
  }

  set (data) {
    return new Promise((resolve, reject) => {
      this.storageArea.set(data, () => {
        if (this.runtime.lastError) {
          console.error(this.runtime.lastError.runtime.lastError);
          reject(data, this.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
  }

  get (key) {
    return new Promise((resolve, reject) => {
      this.storageArea.get(key, data => {
        if (this.runtime.lastError) {
          console.error(this.runtime.lastError.runtime.lastError);
          reject(key, this.runtime.lastError);
        } else {
          resolve(data);
        }
      });
    });
  }

  update (key, updateFunc, callback) {
    callback = callback || function () {};

    return this.get(key).then(data => {
      return this.set(updateFunc(data)).then(callback);
    });
  }
}

exports = module.exports = Storage;
