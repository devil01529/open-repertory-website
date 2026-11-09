(function () {
  'use strict';

  const account = document.querySelector('#menuAccount');
  const signInPath = '/signin-with-chatgpt';
  const signOutPath = '/signout-with-chatgpt';

  function openAccount() {
    OR.dismissMenu();
    if (window.ORStandalone === true) { location.assign('/account'); return; }
    OR.modal({
      title: 'Website account',
      html: '<p>This website uses hosting sign-in. Access is currently restricted to the owner account.</p>' +
        '<p><a href="' + signInPath + '" target="_top">Website sign-in</a> · ' +
        '<a href="' + signOutPath + '" target="_top">Sign out of website</a></p>' +
        '<p>Signing out does not erase clinical records saved in this browser. Keep backups and use a private device.</p>' +
        '<p>Apper has a separate session. Signing in there does not sign you into this website.</p>' +
        '<p><a href="https://preview--openrepertory-eminent.apper.so/owner/login" target="_blank" rel="noopener noreferrer">Existing Apper owner portal ↗</a></p>',
      actions: [{ label: 'Close' }]
    });
  }

  if (account) account.onclick = openAccount;

  const header = document.querySelector('#toolbar .brand');
  if (header) {
    const controls = document.createElement('div');
    controls.className = 'website-session';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Account';
    button.onclick = openAccount;
    controls.append(button);
    header.after(controls);
  }

  const legal = document.createElement('button');
  legal.type = 'button';
  legal.className = 'menu-item';
  legal.textContent = 'Legal information';
  legal.onclick = function () {
    const sources = [...document.querySelectorAll('#mmDetail [data-mm-credits]')];
    OR.dismissMenu();
    OR.modal({
      title: 'Legal information',
      html: '<p>Original notices and source-specific credits are retained here.</p>' +
        '<button type="button" data-legal-repertory>Current repertory credits</button>' +
        sources.map((source, i) => '<button type="button" data-legal-choice="' + i + '">' +
          OR.escapeHTML(source.closest('.oorep-mm-source').querySelector('b').textContent) +
          '</button>').join('') +
        '<p>Open a remedy profile to include its volume credits here.</p>',
      actions: [{ label: 'Close' }],
      onMount: function (modal, close) {
        modal.querySelector('[data-legal-repertory]').onclick = function () {
          close();
          OR.openSourceCredits();
        };
        modal.querySelectorAll('[data-legal-choice]').forEach(button => {
          button.onclick = function () {
            close();
            sources[Number(button.dataset.legalChoice)].click();
          };
        });
      }
    });
  };
  document.querySelector('#menuSettings').append(legal);
})();
