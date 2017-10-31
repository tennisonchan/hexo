// https://developer.chrome.com/extensions/webRequest

const defaultOptions = {
  extraInfoSpec: ['blocking', 'responseHeaders'],
  filter: {
    urls: [ '*://*/*' ],
    types: [ 'script', 'stylesheet' ]
  }
};

class WebRequest {
  constructor ({ webRequest }, options) {
    this.options = Object.assign(defaultOptions, options);
    this.additionHeaders = [];
    this.responseHeaderHandler = {};

    webRequest.onHeadersReceived.addListener(this.lister.bind(this), this.options.filter, this.options.extraInfoSpec);
  }

  lister (details) {
    let { responseHeaders = [] } = details;

    responseHeaders = responseHeaders.map(header => {
      let handler = this.responseHeaderHandler[header.name.toLowerCase()];

      return typeof handler === 'function' && handler(header, details) || header;
    })
    .concat(this.additionHeaders)
    .filter(h => h);

    // console.log('responseHeader', details.url, responseHeaders);

    return { responseHeaders: responseHeaders };
  }

  modifyHeader (name, handler) {
    this.responseHeaderHandler[name] = handler;
  }

  addHeader(newHeader) {
    // console.log('WebRequest.addHeader', newHeader);

    if (newHeader.name && newHeader.value) {
      this.additionHeaders.push(newHeader);
    }
  }
}

exports = module.exports = WebRequest;
