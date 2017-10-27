// https://developer.chrome.com/extensions/webRequest

let responseHeaderHandler = {
  'content-security-policy': function(responseHeader) {
    responseHeader.value = responseHeader.value.split(';').map(function (header) {
      if (header.search('default-src') !== -1) {
        header += ' https://*.cloudfront.net http://localhost:*';
      }

      return header;
    }).join(';');
  },
  'content-type': function (responseHeader) {
    let { value } = responseHeader;
    if (value.indexOf('text/plain') !== -1) {
      responseHeader.value = 'text/javascript; charset=utf-8';
    }
  }
}

function setCookie(responseHeaders) {
  var setMyCookie = {
    name: 'Set-Cookie',
    value: 'my-cookie1=my-cookie-value1'
  };
  responseHeaders.push(setMyCookie);
  return responseHeaders;
}

let callback = function (details) {
  let { responseHeaders = [] } = details;

  for (let i = 0; i < responseHeaders.length; i++) {
    let responseHeader = responseHeaders[i];
    let handler = responseHeaderHandler[responseHeader.name.toLowerCase()];

    typeof handler === 'function' && handler(responseHeader);
  }

  console.log('responseHeaders', details.url, responseHeaders);

  return { responseHeaders: responseHeaders };
}

let filter = {
  urls: ['*://*/*'],
  types: [ 'script', 'stylesheet' ]
};

chrome.webRequest.onHeadersReceived.addListener(callback, filter, ['blocking', 'responseHeaders']);

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
