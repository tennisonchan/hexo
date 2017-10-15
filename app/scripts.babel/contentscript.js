var NorthernBear = (function() {
  var bear = {},
      _port = chrome.runtime.connect({ name: 'content_scripts' });

  function init() {
    console.log('Northern Bear Claws');
    // bear.utility = Utility;
    // https://api.github.com/gists?access_token=b478615c5d59a8722b31d4a831ae8c491909ad41
    // bear.insertScript({ src: 'https://gist.githubusercontent.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
    // bear.insertScript({ src: 'https://cdn.rawgit.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });

    // $.ajax(url)
    //   .done(function(){
    //     bear.insertScript({ src: 'https://gist.githubusercontent.com/tennisonchan/69901fd5fa48cb0d03f5f3bcf48c9f63/raw/dc3e8baa458d447b39423fad9e176af41c0f0875/hello-world.js' });
    //   })
    //   .fail(function(){
    //     console.log('[Northern Bear]: ' + window.location.host + ' does not have a script for it. You may want to create a new script by clicking the icon.');
    //   });

    _port.postMessage({ message: 'initial connection from content script'});
    _port.onMessage.addListener(function(data) {
      console.log('data: ', data);
    });
  }

  bear.help = function() {
    var instruction = {
      insertScript: '([ {src} ]) to insert script into website document head.'
    };

    return instruction;
  };

  bear.insertScript = function(opt) {
    var script = document.createElement('script');
    if(opt.src) {
      script.type = 'text/javascript';
      script.src = opt.src;
    }
    document.head.appendChild(script);
  }

  init();

  return bear;
})();

window.onload = function(){
  window.northernBear = NorthernBear;
}