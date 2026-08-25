/* ============================================================
   担当者の連絡先を「あとから変えられる」ようにするための係
   ------------------------------------------------------------
   アプリの中に電話番号を焼き付けてしまうと、
   番号が変わったとき300人に配り直しになります。
   そこで、番号だけをこの係が読みに行くようにしています。

   読む順番（あとのものが勝ちます）
     1. アプリの中の index.html に書いてある「はじめの値」
     2. アプリに同梱した contacts.json
     3. 前回インターネットから取れた内容（端末に保存したもの）
     4. いまインターネットから取れた最新の内容

   3 があるので、圏外でも「前回わかっていた番号」で電話できます。
   ============================================================ */
(function () {
  'use strict';

  /* 最新の連絡先の取得先。設定は config.js にまとめてあります。
     空のままでも、アプリは同梱の contacts.json で正しく動きます。 */
  var CFG = window.ANPI_CONFIG || {};
  var REMOTE_URL = CFG.REMOTE_URL
    ? CFG.REMOTE_URL + '?p=contacts&k=' + encodeURIComponent(CFG.APP_KEY || '')
    : '';

  var STORE_KEY = 'anpi_contacts_v1';

  function apply(data) {
    if (!data || typeof data !== 'object') return false;
    var changed = false;
    if (Array.isArray(data.tel) && data.tel.length) {
      window.TEL = data.tel;
      changed = true;
    }
    if (typeof data.mail === 'string') {
      window.MAIL = data.mail;
      changed = true;
    }
    if (changed && typeof window.render === 'function') {
      try { window.render(); } catch (e) { /* 画面がまだ無いときは無視 */ }
    }
    return changed;
  }

  /* --- 3. 前回とれた内容（端末の保存）--- */
  function loadCached() {
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) apply(JSON.parse(raw));
    } catch (e) { /* 保存が使えない環境でも動くように、黙って続けます */ }
  }

  function saveCached(data) {
    try {
      window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch (e) { /* 容量不足などは無視 */ }
  }

  /* --- 2. 同梱の contacts.json --- */
  function loadBundled() {
    return fetch('contacts.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d) apply(d); })
      .catch(function () { /* 読めなくても、はじめの値で動きます */ });
  }

  /* --- 4. インターネットから最新 --- */
  function loadRemote() {
    if (!REMOTE_URL) return Promise.resolve();
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 8000) : null;
    return fetch(REMOTE_URL, { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && apply(d)) saveCached(d);
      })
      .catch(function () { /* 圏外・災害時はここに来ます。前回の内容で動き続けます */ })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  loadCached();
  loadBundled().then(loadRemote);
})();
