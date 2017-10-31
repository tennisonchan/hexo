'use strict';

const accessTokenUrl = 'https://github.com/login/oauth/access_token';
const authorizeUrl = 'https://github.com/login/oauth/authorize';

function getUrlParameter(url, name) {
  let results = new RegExp('[\\?&]' + name + '=([^&#]*)').exec(url);
  return results === null ? '' : results[1];
}

class WebAuthFlow {
  constructor({ runtime, identity }, storage) {
    this.identity = identity;
    this.runtime = runtime;
    this.storage = storage;
  }

  launch({ client_secret }) {
    if (!this.identity) { return false; }

    let { oauth2: { client_id, scopes, provider } } = this.runtime.getManifest();
    let redirectUri = this.identity.getRedirectURL(provider);

    this.identity.launchWebAuthFlow({
      url: `${authorizeUrl}?client_id=${client_id}&redirect_uri=${redirectUri}&scope=${scopes.join(' ')}`
    }, redirectUrl => {
      if (this.runtime.lastError) {
        console.error(this.runtime.lastError.message);
        return;
      }
      let code = getUrlParameter(redirectUrl, 'code');
      if (code) {
        this.getAccessToken({ client_id, code, client_secret });
      }
    });
  }

  getAccessToken(payload) {
    fetch(accessTokenUrl, {
      method: 'post',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(resp => resp.json())
    .then(({ access_token }) => this.storage.set({ access_token }))
    .catch((err) => console.error(err));
  }
}

exports = module.exports = WebAuthFlow;