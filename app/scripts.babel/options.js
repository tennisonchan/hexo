'use strict';

function saveOptions() {
  var accessToken = document.getElementById('accessToken').value;
  chrome.storage.sync.set({
    accessToken: accessToken
  }, function () {
    window.close();
  });
}

function restoreOptions() {

  chrome.storage.sync.get({
    accessToken: null
  }, function (items) {
    document.getElementById('accessToken').focus();
    document.getElementById('accessToken').value = items.accessToken;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);