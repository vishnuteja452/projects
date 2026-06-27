const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, 'app.js');
let appContent = fs.readFileSync(appJsPath, 'utf8');

const replacements = [
  ['postra-surface', 'surface'],
  ['postra-border', 'border'],
  ['postra-text', 'foreground'],
  ['postra-muted', 'muted'],
  ['postra-hover', 'accent'],
  ['postra-bg', 'background'],
  ['postra-blue', 'primary'],
  ['postra-orange', 'primary'],
  ['text-white', 'text-foreground'],
  ['bg-black', 'bg-background'],
  ['orb-glow', 'shadow-lg shadow-primary/20'],
  ['glass', 'glass-panel'],
];

for (const [search, replace] of replacements) {
  // Global replace using regex
  const regex = new RegExp(search, 'g');
  appContent = appContent.replace(regex, replace);
}

// Additional specific UI enhancements for app.js strings
appContent = appContent.replace(/class="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"/g, 'class="flex items-center gap-3 cursor-pointer group"');
appContent = appContent.replace(/class="text-xs font-semibold text-muted uppercase tracking-wider mb-2"/g, 'class="px-2 text-xs font-semibold text-muted uppercase tracking-wider mb-3"');
appContent = appContent.replace(/class="bg-surface border border-border rounded-md p-2/g, 'class="premium-card p-3');

fs.writeFileSync(appJsPath, appContent);
console.log('Successfully refactored app.js');
