const regexExtract = new RegExp('\/(.*)\/([gimuy]+)?');

class RegExConverter extends RegExp {
  constructor(input) {
    if (typeof input === 'string' || input instanceof String) {
      if (regexExtract.test(input)) {
        let parts = regexExtract.exec(input);
        super(parts[1], parts[2] || '')
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

exports = module.exports = RegExConverter;
