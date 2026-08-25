/* ============================================================
   ★ここだけ書き換えれば、アプリが会社の「倉庫」につながります★
   ------------------------------------------------------------
   手順
     1. Googleスプレッドシートで Apps Script を「デプロイ」する
     2. 出てきた https://script.google.com/macros/s/……/exec を
        下の REMOTE_URL に貼る
     3. Code.gs の APP_KEY と、下の APP_KEY を「同じ文字列」にする
     4. アプリを作り直す（作業記録のコマンド参照）

   空のままでも、アプリはちゃんと動きます。
   その場合は「メールで送る」方式だけになり、
   電話番号はアプリに同梱したものが使われます。
   ============================================================ */
window.ANPI_CONFIG = {

  /* 倉庫のURL。デプロイして出てきた /exec で終わるURLを貼ってください */
  REMOTE_URL: 'https://script.google.com/macros/s/AKfycbzAiV9ThJYKyROqd5hlrwxy56pCH_vwtVDfgkkZTER07pjO--Sd2V6ZPmEqMwn4iX1v/exec',

  /* 合いことば。Code.gs の APP_KEY と必ず同じにしてください。
     URLを偶然知った人が、電話番号を見たり嘘の回答を送ったりできないようにするためのものです。 */
  APP_KEY: 'kline-anpi-20260820'

};
