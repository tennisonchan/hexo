const regexExtract = /\/([-a-zA-Z0-9@:%_\+.~#?&\/\/=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&\/\/=*]*)?)\/([gimuy]+)?/;

class RegExt extends RegExp {
  constructor(input) {
    if (typeof input === 'string' || input instanceof String) {
      if (regexExtract.test(input)) {
        let parts = regexExtract.exec(input);
        super(parts[1], parts[3] || '');
      } else {
        super(input);
      }
    } else if (input instanceof RegExp) {
      super(input);
    }
  }

  toJSON() {
    return this.toString();
  }
}

exports = module.exports = RegExt;
