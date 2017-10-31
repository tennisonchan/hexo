const matchPattern = new RegExp('^' +
'(?:' +
    '([^:/?#.]+)' +                  // scheme - ignore special characters
                                     // used by other URL parts such as :,
                                     // ?, /, #, and .
':)?' +
'(?://' +
    '(?:([^/?#]*)@)?' +              // userInfo
    '([^/#?]*?)' +                   // domain
    '(?::([0-9]+))?' +               // port
    '(?=[/#?]|$)' +                  // authority-terminating character
')?' +
'([^?#]+)?' +                        // path
'(?:\\?([^#]*))?' +                  // query
'(?:#(.*))?' +                       // fragment
'$');

function matchPatternToRegExp(pattern) {
  if (pattern === '<all_urls>') {
    return (/^(?:https?|file|ftp|app|chrome-extension):\/\//);
  }
  const match = matchPattern.exec(pattern);
  if (!match) {
    throw new TypeError(`"${ pattern }" is not a valid MatchPattern`);
  }
  const [ , scheme, userInfo, domain, port, path, query, fragment ] = match;
  return new RegExp('^(?:'
    + (scheme === '*' ? '(https?|file|ftp|app|chrome-extension)' : escape(scheme)) + ':\\/\\/'
    + (domain === '*' ? '[^\\/]*' : escape(domain).replace(/^\*\./g, '(?:[^\\/]+)?'))
    + (path ? (path == '*' ? '(?:\\/.*)?' : (escape(path).replace(/\*/g, '.*'))) : '\\/?')
    + ')$');
}

exports = module.exports = { matchPattern, matchPatternToRegExp };
