'use strict';

const DEFAULT_SCOPE = ['gist', 'user', 'repo'].join(' ');

class WebAuthFlow {
  constructor(chrome, storage) {
    this.identity = chrome.identity;
    this.storage = storage;
    this.redirectUri = `https://${chrome.runtime.id}.chromiumapp.org`;
  }

  getAuthUrl({ clientId, scope = DEFAULT_SCOPE }) {
    return `https://github.com/login/oauth/authorize/?client_id=${clientId}&redirect_uri=${this.redirectUri}&scope=${scope}`;
  }

  launch(params) {
    if (!this.identity) { return false; }

    this.identity.launchWebAuthFlow({
      url: this.getAuthUrl(params),
      interactive: true,
    }, redirectUrl => {
      redirectUrl && redirectUrl
        .substr(redirectUrl.indexOf('#') + 1)
        .split('&')
        .forEach(query => {
          if (query.includes('access_token')) {
            let accessToken = query.split('=')[1];
            console.log('token is', accessToken);
            this.storage.set({ accessToken });
          }
        });
    });
  }
}

exports = module.exports = WebAuthFlow;