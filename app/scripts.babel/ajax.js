function request(options) {
  return new Promise(function (resolver, reject) {
    let xhr = new XMLHttpRequest();
    let { url, type = 'GET', data = null, headers, dataType = 'json' } = options;

    xhr.open(type, url, true);
    xhr.responseType = dataType;

    if (headers) {
      for(let key in headers) {
        xhr.setRequestHeader(key, headers[key]);
      }
    }

    xhr.onload = function({ target }) {
      resolver(target.response);
    };
    xhr.onerror = reject;
    xhr.send(data);
  });
}

class Ajax {
  static request(url, options) {
    return request(Object.assign({ url }, options));
  }

  static get(url) {
    return request({ url, type: 'GET', data: null });
  }

  static post(url, options) {
    return request(Object.assign({ url, type: 'POST' }, options));
  }
}
