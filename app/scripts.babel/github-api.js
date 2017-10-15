import Ajax from './ajax';

class GithubAPI {
  constructor(accessToken) {
    this.baseUrl = 'https://api.github.com';
    this.accessToken = accessToken || null;
  }

  _checkAccessTokenAbsence() {
    return this.accessToken === null;
  }

  _callAPI(url, options) {
    // return new Promise((resolve, reject) => {
      if (this._checkAccessTokenAbsence()) return false;
      options = options || {};

      return Ajax.request(url, options);
    // });
  }

  getPRData({ owner, repo, pr_number }) {
    let url = `${this.baseUrl}/repos/${owner}/${repo}/pulls/${pr_number}?access_token=${this.accessToken}`;

    return this._callAPI(url);
  }

  getCommentsData({ owner, repo, pr_number }) {
    let url = `${this.baseUrl}/repos/${owner}/${repo}/issues/${pr_number}/comments?access_token=${this.accessToken}`;

    return this._callAPI(url);
  }

  getPRStatusData({ owner, repo, ref }) {
    // "https://api.github.com/repos/alphasights/pistachio/statuses/5b9c1ad2166607d1723c6954b0ab90fe8f1df64b"
    let url = `${this.baseUrl}/repos/${owner}/${repo}/commits/${ref}/status?access_token=${this.accessToken}`;

    return this._callAPI(url);
  }

  getGists(since) {
    let url = `${this.baseUrl}/gists?access_token=${this.accessToken}`;

    if (since) {
      // YYYY-MM-DDTHH:MM:SSZ
      url += `?since=${since}`;
    }
    return this._callAPI(url);
  }

  performMerge({ owner, repo, sha }, data) {
    // /repos/:owner/:repo/merges
    let url = `${this.baseUrl}/repos/${owner}/${repo}/merges?access_token=${this.accessToken}`;

    // data = {
    //   base: 'master', // base.ref
    //   head: 'cool_feature', // head.ref
    //   commit_message: 'Shipped cool_feature!'
    // }

    return this._callAPI(url, {
      method: 'POST',
      data: data,
    });
  }
}
