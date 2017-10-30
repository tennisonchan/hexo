'use strict';

class WebAuthFlow {
  constructor({ runtime, identity }, storage) {
    let { oauth2: { client_id, scopes, provider, base_url } } = runtime.getManifest();
    let clientId = encodeURIComponent(client_id);
    let scope = encodeURIComponent(scopes.join(' '));
    let redirectUri = identity.getRedirectURL(provider);

    this.identity = identity;
    this.runtime = runtime;
    this.storage = storage;
    this.url = `${base_url}?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`;
  }

  launch() {
    if (!this.identity) { return false; }

    this.identity.launchWebAuthFlow({
      url: this.url,
      interactive: true,
    }, redirectUrl => {
      if (this.runtime.lastError) {
        console.error(this.runtime.lastError.message);
        return false;
      }
      console.log('redirectUrl', redirectUrl);
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