# Hexo
A chrome extension that runs your gist script on page equipped with all powerful Chrome background API

## Features - Things you can do via Gist
- [ ] Scrap the page
- [ ] Watch any changes on website
- [ ] Chrome Notification
- [ ] Load custom popup page
- [ ] AMD like Require
- [x] Implement Template
- [x] Grab any elements on the page
- [x] Add, remove and edit response headers
- [x] Set cookie
- [x] Inject styles and scripts

## To-Do
- [x] Update popup panel after reload
- [x] Loading gist scripts before portal
- [x] Fix the "current loaded files"
- [x] Fix issue of loading removed script on gist
- [x] Impletment `@require` to pre-load lib like jQuery
- [x] Fix RegExt for path
- [x] Use match pattern for url instead

### WebRequest
#### Modify Response Headers
To modify headers on Content Security Policy.
```js
// this allows to call external scripts on site with CSP, like facebook
hexo.modifyHeader('content-security-policy', function (headers, details) {
  header.value = headers.value.split(';').map(function (header) {
    if (header.includes('script-src')) {
      header += ' https://*.cloudfront.net';
    }
    return header;
  }).join(';');

  return header;
})
```

### Render Templates
To render templates in [mustache](https://github.com/janl/mustache.js).
- All templates need to be in one gist html file.
- It uses [HTML imports](https://www.w3.org/TR/html-imports/).
- To make the templates are loaded before the script run, use `hexo.ready`.

```html
// In gist html file: hexo-demo.html
<script type="x-tmpl-mustache" id="template-id">
  <div class='hexo-message'>
    {{#msg}}
      <span >Hexo message {{ msg }}</span>
    {{/msg}}
    {{^msg}}
      <span >No message</span>
    {{/msg}}
  </div>
</script>
```

```js
// In gist javascript file: hexo-demo.js

hexo.ready(() => {
  let complied = hexo.template('#template-id');
  let html = complied({ msg: 'hello world!' });

  $('body').append(html);
});
```