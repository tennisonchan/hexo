// https://developer.chrome.com/extensions/webRequest

const defaultOptions = {
  extraInfoSpec: ['blocking', 'responseHeaders'],
  filter: {
    urls: [ '*://*/*' ],
    types: [ 'script', 'stylesheet' ]
  }
};

class WebRequest {
  constructor (options) {
    options = Object.assign(defaultOptions, options);
    this.options = options;
    this.additionHeaders = [];
    this.removeHeaders = [];
    this.responseHeaderHandler = {};

    chrome.webRequest.onHeadersReceived.addListener(this.lister.bind(this), options.filter, options.extraInfoSpec);
  }

  lister (details) {
    let { responseHeaders = [] } = details;

    for (let i = 0; i < responseHeaders.length; i++) {
      let responseHeader = responseHeaders[i];
      let headerName = responseHeader.name.toLowerCase();

      if (this.removeHeaders[headerName] !== undefined) {
        console.log('remove header:', headerName);
        responseHeaders.splice(i, 1);
        continue;
      }

      let handler = this.responseHeaderHandler[headerName];
      typeof handler === 'function' && handler(responseHeader, details);
    }

    responseHeaders = responseHeaders.concat(this.additionHeaders);

    // console.log('responseHeader', details.url, responseHeaders);

    return { responseHeaders: responseHeaders };
  }

  registerHandler (headerName, handler) {
    this.responseHeaderHandler[headerName] = handler;
  }

  addHeader(newHeader) {
    // console.log('WebRequest.addHeader', newHeader);

    if (newHeader.name && newHeader.value) {
      this.additionHeaders.push(newHeader);
    }
  }

  remove(headername) {
    this.removeHeaders.push(headername);
  }
}

exports = module.exports = WebRequest;

// let responseHeaderHandler = {
//   'content-security-policy': function(responseHeader) {
//     responseHeader.value = responseHeader.value.split(';').map(function (header) {
//       if (header.search('default-src') !== -1) {
//         header += ' https://*.cloudfront.net http://localhost:*';
//       }

//       return header;
//     }).join(';');
//   },
//   'content-type': function (responseHeader) {
//     let { value } = responseHeader;
//     if (value.indexOf('text/plain') !== -1) {
//       responseHeader.value = 'text/javascript; charset=utf-8';
//     }
//   }
// }

// details: {
//   frameId: 0
//   method: "GET"
//   parentFrameId: -1
//   requestHeaders: (10) [{…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}, {…}]
//   requestId: "580164"
//   tabId: 5681
//   timeStamp: 1507562559997.534
//   type: "script"
//   url: "https://apis.google.com/_/scs/abc-static/_/js/k=gapi.gapi.en.ZPSwvoEq44A.O/m=gap
// }

// requestHeaders: {
//   "content-type": {
//     value: "text/javascript; charset=UTF-8"
//   }
// }
