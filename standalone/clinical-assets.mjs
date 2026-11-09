// Website-only adaptations. The APK snapshot and repertory data remain byte-identical.
function replaceOnce(text, old, replacement) {
  if (text.split(old).length !== 2) throw Error('Clinical asset changed; review website adaptation');
  return text.replace(old, replacement);
}
export function adaptAsset(relative, text, userId) {
  if (!/^[a-f0-9]{32}$/.test(userId)) throw Error('Invalid account');
  if (relative === 'index.html') {
    text = text.replace('<html lang="en">', '<html lang="en" class="workspace-booting">');
    text = text.replace('<head>', `<head><style>
      html.workspace-booting body> :not(#workspaceBoot){visibility:hidden!important;pointer-events:none!important}
      #workspaceBoot{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;padding:20px;background:#edf2f8;color:#193149;font:16px/1.6 system-ui}
      #workspaceBoot section{max-width:540px;width:100%;padding:clamp(22px,5vw,40px);border:1px solid #c8d7e4;border-radius:24px;background:#fff;box-shadow:0 12px 48px #16334c12}
      #workspaceBoot h1{font-size:clamp(22px,4vw,30px);line-height:1.3;margin:0 0 16px}
      #workspaceBoot p{margin:12px 0}#workspaceBoot button{padding:12px 20px;border:0;border-radius:12px;background:#235fcf;color:white;font:600 16px system-ui;min-height:48px;cursor:pointer}
      #bootSpinner{width:28px;height:28px;border:3px solid #d8e5f5;border-top-color:#235fcf;border-radius:50%;animation:boot-spin .9s linear infinite;margin-top:20px}
      @keyframes boot-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){#bootSpinner{animation:none}}
      @media(prefers-color-scheme:dark){#workspaceBoot{background:#111c27;color:#e5edf7}#workspaceBoot section{background:#1b2939;border-color:#425671}}
    </style><script src="js/boot.js"></script>`);
    text = text.replace('<body class="clinical-workspace liquid-glass">', `<body class="clinical-workspace liquid-glass"><div id="workspaceBoot" role="dialog" aria-modal="true" aria-labelledby="bootTitle"><section><h1 id="bootTitle">Before you enter</h1><div id="bootMessage" role="status"><p><strong>Your clinical case content is not stored in our server database.</strong> Initials, totality and case analysis are saved only in this browser for your account.</p><p>We retain your login account, approval status and security records, and host the repertory library. Website storage is not empty.</p><p>Do not enter identifying patient information. Browser data is not encrypted; clearing it can delete your cases.</p></div><button id="bootContinue" type="button">Continue to workspace</button><div id="bootSpinner" hidden aria-hidden="true"></div></section></div>`);
    for (const file of ['patients', 'lifecycle', 'recovery', 'clinician-tools']) {
      text = replaceOnce(text, `<script src="js/${file}.js"></script>`, '');
    }
    text = replaceOnce(text, '<script src="js/platform.js"></script>', '<script src="js/case-policy.js"></script>\n<script src="js/platform.js"></script>');
    text = replaceOnce(text, '<script src="js/start.js"></script>', '<script src="js/initials-workspace.js"></script>\n<script src="js/web-motion.js"></script>\n<script src="js/start.js"></script>');
    text = text.replace(/<!-- PATIENTS PAGE -->[\s\S]*?<!-- PATIENT FILE PAGE -->/, '<div id="page-patients" class="page"></div>\n<!-- PATIENT FILE PAGE -->');
    text = text.replace('\\n<meta name="referrer"', '\n<meta name="referrer"');
    return text.replace('</head>', '<link rel="stylesheet" href="css/initials-workspace.css"><link rel="stylesheet" href="css/responsive-workspace.css"></head>');
  }
  if (relative === 'js/start.js') {
    text = replaceOnce(text, 'await OR.start();', 'await ORBoot.start(() => OR.start());');
    text = replaceOnce(text, 'ORRecovery.show(error);', 'ORBoot.fail(error);');
  }
  if (relative === 'js/platform.js') {
    text = replaceOnce(text, 'const ENVELOPE = "openrepertory_browser_store_v2";', `const ENVELOPE = "or_initials_v1_${userId}";`);
    text = replaceOnce(text, '    migrate() {', '    migrate() { return; // Never import shared legacy patient records.\n');
    text = replaceOnce(text, '    batch(values) {', '    batch(values) {\n      ORCasePolicy.validateWrites(values);');
  }
  if (relative === 'js/app.js') {
    const deferred = `      let started = false;
      const begin = () => {
        if (started) return;
        started = true;
        if (repSelection !== 0 || state.repertory) return;
        applyRepertory(startId).catch(() => {
        });
      };
      requestAnimationFrame(() => requestAnimationFrame(begin));
      setTimeout(begin, 150);`;
    text = replaceOnce(text, deferred, '      await applyRepertory(startId);');
    text = replaceOnce(text, 'OR.newCase = function(name, patientId) {', 'OR.newCase = async function(name, patientId) {\n    name = ORCasePolicy.initials(name);\n    if (!await ORCasePolicy.makeRoom(OR)) return null;');
    text = replaceOnce(text, 'patientId: patientId || null, analysis: []', 'createdAt: Date.now(), analysis: []');
    text = replaceOnce(text, 'Name this case (e.g. patient initials)', 'Initials only (1–4 letters). Do not enter a name.');
    text = replaceOnce(text, '    c.name = name;', '    c.name = ORCasePolicy.initials(name);');
    text = replaceOnce(text, '"Rename case", c.name, "Case name"', '"Edit initials", c.name, "Initials only (1–4 letters)"');
    text = text.replaceAll('name: "Case 1",', 'name: "XX", createdAt: Date.now(),');
    text = replaceOnce(text, '  function showPage(page) {', '  function showPage(page) {\n    if (["patients", "file"].includes(page)) page = "dashboard";');
    text = replaceOnce(text, '      modal.querySelectorAll("[data-snap-restore]").forEach((btn) => btn.addEventListener("click", async () => {', '      modal.querySelectorAll("[data-snap-restore]").forEach((btn) => btn.addEventListener("click", async () => {\n        if (!await ORCasePolicy.makeRoom(OR)) return;');
    text = replaceOnce(text, 'name: `${c.name} \\xB7 restored ${new Date(s.savedAt).toLocaleDateString()}`, patientId: c.patientId || null,', 'name: c.name, createdAt: Date.now(),');
    // Route every Today render, including the private app closure, into the website workflow.
    text = replaceOnce(text, '  function renderDashboard() {', '  function renderDashboard() {\n    if (OR.renderInitialsToday) return OR.renderInitialsToday();');
  }
  if (relative === 'js/clinical-ui.js') {
    text = replaceOnce(text, '  function renderToday() {', '  function renderToday() {\n    if (OR.renderInitialsToday) return OR.renderInitialsToday();');
  }
  return text;
}
