// Website-only adaptations. The APK snapshot and repertory data remain byte-identical.
function replaceOnce(text, old, replacement) {
  if (text.split(old).length !== 2) throw Error('Clinical asset changed; review website adaptation');
  return text.replace(old, replacement);
}
export function adaptAsset(relative, text, userId) {
  if (!/^[a-f0-9]{32}$/.test(userId)) throw Error('Invalid account');
  if (relative === 'index.html') {
    for (const file of ['patients', 'lifecycle', 'recovery', 'clinician-tools']) {
      text = replaceOnce(text, `<script src="js/${file}.js"></script>`, '');
    }
    text = replaceOnce(text, '<script src="js/platform.js"></script>', '<script src="js/case-policy.js"></script>\n<script src="js/platform.js"></script>');
    text = replaceOnce(text, '<script src="js/start.js"></script>', '<script src="js/initials-workspace.js"></script>\n<script src="js/start.js"></script>');
    text = text.replace(/<!-- PATIENTS PAGE -->[\s\S]*?<!-- PATIENT FILE PAGE -->/, '<div id="page-patients" class="page"></div>\n<!-- PATIENT FILE PAGE -->');
    return text.replace('</head>', '<link rel="stylesheet" href="css/initials-workspace.css"></head>');
  }
  if (relative === 'js/platform.js') {
    text = replaceOnce(text, 'const ENVELOPE = "openrepertory_browser_store_v2";', `const ENVELOPE = "or_initials_v1_${userId}";`);
    text = replaceOnce(text, '    migrate() {', '    migrate() { return; // Never import shared legacy patient records.\n');
    text = replaceOnce(text, '    batch(values) {', '    batch(values) {\n      ORCasePolicy.validateWrites(values);');
  }
  if (relative === 'js/app.js') {
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
