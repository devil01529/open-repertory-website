// Product presentation only. Never change database IDs, storage keys, package IDs,
// provider notices, signing identities or update URLs during a brand migration.
const presentationFiles = new Set([
  'index.html', 'js/app.js', 'js/platform.js', 'js/clinical-ui.js',
  'js/materia.js', 'js/backup.js', 'css/glass-web.css'
]);
export function brandAsset(relative, text) {
  if (!presentationFiles.has(relative)) return text;
  text = text.replaceAll('Open Repertory', 'Similora');
  if(relative==='js/app.js')text=text.replace('(?:OOREP', '(?:Open Repertory source|OOREP');
  if (relative === 'index.html') {
    text = text.replaceAll('img/brandmark.png', '/similora-mark-v1.png');
    text = text.replace('<title>Similora — Repertory, Cases &amp; Patients</title>', '<title>Similora — Clinical workspace</title>');
  }
  return text;
}
export const brandedAssets = presentationFiles;
