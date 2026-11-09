(function () {
  'use strict';
  const account = document.querySelector('#menuAccount');
  if (account) account.onclick = function () {
    OR.modal({
      title: 'Website access',
      html: '<p>This deployment is private to the website owner. Member browser approval is not enabled yet.</p><p>Browser records stay in this browser and are separate from Android records. Export backups regularly.</p><p><a href="https://preview--openrepertory-eminent.apper.so/owner/login" target="_blank" rel="noopener noreferrer">Open existing Apper owner portal ↗</a></p>',
      actions: [{ label: 'Close' }]
    });
  };
})();
