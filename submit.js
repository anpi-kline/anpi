/* ============================================================
   アプリの中だけで報告を完結させる係
   ------------------------------------------------------------
   メールアプリを開かずに、ボタンを押すだけで会社の表に記録されます。
   災害時にメールアプリの操作でつまずく人が出ないようにするためです。

   誰からの報告かを知る必要があるので、
   はじめて開いたときに一度だけメールアドレスを聞きます。
   （入力は1回だけ。次からは端末が覚えています）

   config.js の REMOTE_URL が空のときは、この係は何もしません。
   その場合は、これまでどおり「メールで送る」だけになります。
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.ANPI_CONFIG || {};
  var URL_BASE = CFG.REMOTE_URL || '';
  var MAIL_KEY = 'anpi_my_email_v1';

  if (!URL_BASE) return;          /* 未設定なら何もしない */

  var TXT = {
    ja: {
      ask:    'はじめに、あなたのメールアドレスを1回だけ登録してください',
      askSub: '会社が「誰からの報告か」を知るために使います。次回からは聞きません。',
      ph:     'あなたのメールアドレス',
      save:   '登録する',
      bad:    'メールアドレスの形が正しくないようです',
      saved:  '登録しました',
      change: 'メールアドレスを変える',
      send:   '📲 アプリから直接送る（おすすめ）',
      sending:'送信中…',
      ok:     '会社に届きました。ありがとうございました。',
      ng:     '送れませんでした。電波を確認して、もう一度押してください。それでも送れないときは「メールで送る」か、電話でご報告ください。',
      pick:   'まず 1・2・3 のどれかを選んでください'
    },
    pt: {
      ask:    'Primeiro, cadastre seu e-mail uma unica vez',
      askSub: 'A empresa usa isso para saber de quem e a resposta. Nao vamos perguntar de novo.',
      ph:     'Seu e-mail',
      save:   'Cadastrar',
      bad:    'O e-mail parece estar incorreto',
      saved:  'Cadastrado',
      change: 'Trocar meu e-mail',
      send:   '📲 Enviar direto pelo aplicativo (recomendado)',
      sending:'Enviando…',
      ok:     'Recebido pela empresa. Obrigado!',
      ng:     'Nao foi possivel enviar. Verifique o sinal e toque de novo. Se continuar, use "enviar por e-mail" ou ligue.',
      pick:   'Escolha primeiro 1, 2 ou 3'
    }
  };

  function tx(k) {
    var l = (window.lang === 'pt') ? 'pt' : 'ja';
    return TXT[l][k];
  }

  function myEmail() {
    try { return window.localStorage.getItem(MAIL_KEY) || ''; } catch (e) { return ''; }
  }

  function setMyEmail(v) {
    try { window.localStorage.setItem(MAIL_KEY, v); } catch (e) { /* 保存できない環境でも続行 */ }
  }

  function looksLikeEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  }

  /* --- はじめの1回だけ出す、メールアドレスの登録欄 --- */
  function askBox() {
    var wrap = document.createElement('div');
    wrap.id = 'anpi-ask';
    wrap.style.cssText =
      'margin:12px 14px;padding:14px 16px;border-radius:12px;' +
      'background:#fff8e6;border:1px solid #f0d391;color:#1c2430;font-size:14px;line-height:1.7';
    wrap.innerHTML =
      '<div style="font-weight:800;margin-bottom:2px"></div>' +
      '<div style="font-size:12.5px;color:#6b7787;margin-bottom:8px"></div>' +
      '<input type="email" inputmode="email" autocomplete="email" ' +
      'style="width:100%;padding:10px;border:1px solid #dfe4ea;border-radius:8px;font-size:15px">' +
      '<button style="margin-top:8px;width:100%;padding:11px;border:none;border-radius:8px;' +
      'background:#0b63c5;color:#fff;font-size:15px;font-weight:800;cursor:pointer"></button>' +
      '<div style="font-size:12.5px;color:#c0392b;margin-top:6px;display:none"></div>';

    var kids = wrap.children;
    kids[0].textContent = tx('ask');
    kids[1].textContent = tx('askSub');
    kids[2].placeholder = tx('ph');
    kids[3].textContent = tx('save');

    kids[3].onclick = function () {
      var v = kids[2].value.trim();
      if (!looksLikeEmail(v)) {
        kids[4].textContent = tx('bad');
        kids[4].style.display = 'block';
        return;
      }
      setMyEmail(v);
      wrap.remove();
      addSendButton();
    };
    return wrap;
  }

  /* --- 「アプリから直接送る」ボタンを、確認画面のいちばん上に足す ---
     元の画面は「この内容で報告する」を押すと #doneArea に確認内容が出て、
     そこに「メールで送る」ボタンが現れます。その手前に置くことで、
     メールアプリを開かなくても報告が完了できるようにします。 */
  function addSendButton() {
    if (!myEmail()) return;
    if (document.getElementById('anpi-direct')) return;

    var done = document.getElementById('doneArea');
    if (!done || done.className === 'hide' || !done.innerHTML) return;

    var btn = document.createElement('button');
    btn.id = 'anpi-direct';
    btn.className = 'go';
    btn.textContent = tx('send');
    btn.style.cssText = 'background:#1a8a4a;margin-top:14px';
    btn.onclick = sendDirect;

    var wrap = document.createElement('p');
    wrap.appendChild(btn);

    /* 「メールで送る」ボタンがあればその手前、無ければ末尾に置く */
    var mailBtn = done.querySelector('button.go[onclick*="sendMail"]');
    if (mailBtn && mailBtn.parentNode.parentNode === done) {
      done.insertBefore(wrap, mailBtn.parentNode);
    } else {
      done.appendChild(wrap);
    }
  }

  function note(msg, color) {
    var d = document.getElementById('anpi-note');
    if (!d) {
      d = document.createElement('div');
      d.id = 'anpi-note';
      d.style.cssText = 'margin-top:10px;padding:11px 14px;border-radius:9px;font-size:14px;line-height:1.7';
      var b = document.getElementById('anpi-direct');
      if (b) b.parentNode.appendChild(d);
    }
    d.style.background = color;
    d.textContent = msg;
  }

  function sendDirect() {
    if (!window.pick) { note(tx('pick'), '#fdf3e0'); return; }

    var btn = document.getElementById('anpi-direct');
    btn.disabled = true;
    btn.textContent = tx('sending');

    var val = function (id) {
      var e = document.getElementById(id);
      return e ? e.value : '';
    };
    var dv = window.dv || function (v) { return v; };
    var g = window.geo || null;

    var payload = {
      k:       (window.ANPI_CONFIG || {}).APP_KEY || '',
      email:   myEmail(),
      status:  window.pick,
      work:    dv(val('q_work')),
      family:  dv(val('q_fam')),
      house:   dv(val('q_house')),
      comment: val('q_msg'),
      place:   g ? (g.lat + ', ' + g.lng) : '',
      lat:     g ? g.lat : '',
      lng:     g ? g.lng : ''
    };

    /* Content-Type を text/plain にしているのは、Apps Script 相手に
       ブラウザの事前確認（プリフライト）を起こさせないためです。
       中身はJSONのままで、サーバー側でそのまま読めます。 */
    fetch(URL_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.ok) {
          note(tx('ok'), '#e6f5ec');
          btn.textContent = '✓';
        } else {
          throw new Error((d && d.error) || 'ng');
        }
      })
      .catch(function () {
        note(tx('ng'), '#fdeceb');
        btn.disabled = false;
        btn.textContent = tx('send');
      });
  }

  /* 画面は setLang / render で作り直されるので、そのたびにボタンを足し直す */
  function attach() {
    if (myEmail()) {
      addSendButton();
    } else {
      var main = document.getElementById('app') || document.body;
      if (!document.getElementById('anpi-ask')) {
        main.parentNode.insertBefore(askBox(), main);
      }
    }
  }

  /* 画面が作り直されるたびに、必要なものを足し直す */
  function hook(name) {
    var orig = window[name];
    if (typeof orig !== 'function') return;
    window[name] = function () {
      var r = orig.apply(this, arguments);
      setTimeout(attach, 0);
      return r;
    };
  }
  hook('render');       /* 最初の描画・言語切替のとき */
  hook('submitForm');   /* 「この内容で報告する」を押したとき */
  setTimeout(attach, 0);
})();
