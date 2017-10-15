let _port = chrome.runtime.connect({ name: 'content_scripts' });

class NorthernBear {
  constructor() {
    console.log('NorthernBear.init');

    _port.postMessage({ message: 'initial connection from content script'});
    _port.onMessage.addListener(function(data) {
      console.log('data: ', data);
    });

    // https://api.github.com/gists?access_token=b478615c5d59a8722b31d4a831ae8c491909ad41
    // bear.insertScript({ src: 'https://gist.githubusercontent.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
    // bear.insertScript({ src: 'https://cdn.rawgit.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
  }

  insertScript({ src }) {
    let script = document.createElement('script');
    if (src) {
      script.type = 'text/javascript';
      script.src = src;
    }
    document.body.appendChild(script);
  }
}

window.northernBear = new NorthernBear();