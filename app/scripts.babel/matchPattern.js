const matchPattern = (/^(?:(\*|http|https|file|ftp|app|chrome-extension):\/\/([^\/]+|)\/?(.*))$/i);

function matchPatternToRegExp(pattern) {
  if (pattern === '<all_urls>') {
    return (/^(?:https?|file|ftp|app):\/\//);
  }
  const match = matchPattern.exec(pattern);
  if (!match) {
    throw new TypeError(`"${ pattern }" is not a valid MatchPattern`);
  }
  const [ , scheme, host, path, ] = match;
  return new RegExp('^(?:'
    + (scheme === '*' ? 'https?' : escape(scheme)) + ':\\/\\/'
    + (host === '*' ? '[^\\/]*' : escape(host).replace(/^\*\./g, '(?:[^\\/]+)?'))
    + (path ? (path == '*' ? '(?:\\/.*)?' : ('\\/' + escape(path).replace(/\*/g, '.*'))) : '\\/?')
    + ')$');
}

exports = module.exports = { matchPattern, matchPatternToRegExp };
