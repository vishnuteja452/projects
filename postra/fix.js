const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/kadge/OneDrive/Desktop/projects/postra';

function replaceInFile(filename, replacements) {
  const filePath = path.join(dir, filename);
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [search, replace] of replacements) {
    content = content.split(search).join(replace);
  }
  fs.writeFileSync(filePath, content);
}

// 1. style.css changes
replaceInFile('style.css', [
  ['#ff4500', '#3b82f6'], 
  ['primary-orange', 'primary-blue'],
  // Fix hardcoded dark colors
  ['background-color: #272729;', 'background-color: var(--surface-hover);'],
  ['background-color: #1a1a1b;', 'background-color: var(--surface);'],
  ['border-color: #d7dadc;', 'border-color: var(--border-hover);'],
  ['color: white;', 'color: var(--text-main);'],
  ['background: #000;', 'background: var(--surface-hover);'],
  ['background: #343536;', 'background: var(--surface-hover);'],
  ['background: white;', 'background: var(--surface);'],
  ['color: black;', 'color: var(--text-main);'],
  ['background: #1a1a1b;', 'background: var(--surface);'],
]);

let cssContent = fs.readFileSync(path.join(dir, 'style.css'), 'utf8');
cssContent = cssContent.replace(
  /\.logo-circle \{[\s\S]*?color: var\(--text-main\);\n/g, 
  '.logo-circle {\n    width: 32px;\n    height: 32px;\n    background-color: var(--primary-blue);\n    border-radius: 50%;\n    display: flex;\n    align-items: center;\n    justify-content: center;\n    color: white;\n' 
);
cssContent = cssContent.replace(
  /\.btn-primary \{ background: var\(--surface\); color: var\(--text-main\); \}/,
  '.btn-primary { background: var(--primary-blue); color: white; border: none; }'
);
fs.writeFileSync(path.join(dir, 'style.css'), cssContent);

// 2. index.html changes
replaceInFile('index.html', [
  ['#ff4500', '#3b82f6'],
  ['postra-orange', 'postra-blue'],
  ['body { background-color: #030303; color: #d7dadc; }', 'body { background-color: var(--background); color: var(--text-main); }'],
  ['#030303', 'var(--background)'],
  ['#d7dadc', 'var(--text-main)'],
  ['text-white/40', 'text-postra-muted'],
  ['text-white/50', 'text-postra-muted'],
  ['text-white/20', 'text-postra-muted/50'],
  ['text-white', 'text-postra-text'],
  ['bg-black/95', 'bg-postra-text/20'],
  ['bg-black/80', 'bg-postra-text/20'],
  ['bg-[#0f0f0f]', 'bg-postra-surface'],
  ['bg-black/40', 'bg-postra-surface'],
  ['border-white/10', 'border-postra-border'],
  ['border-white/20', 'border-postra-border'],
  ['border-white/5', 'border-postra-border'],
  ['bg-white/5', 'bg-postra-surface'],
  ['bg-white/10', 'bg-postra-border/20'],
  ['bg-white', 'bg-postra-bg'],
  ['text-black', 'text-postra-text'],
  ['rgba(255, 69, 0', 'rgba(59, 130, 246'], 
  ['rgba(26, 26, 27, 0.7)', 'rgba(255, 255, 255, 0.9)'], 
  ['rgba(255, 255, 255, 0.05)', 'rgba(0, 0, 0, 0.05)']
]);

let htmlContent = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
htmlContent = htmlContent.replace(/text-postra-text font-black text-xl\">P/g, 'text-white font-black text-xl\">P');
htmlContent = htmlContent.replace(/text-postra-text rounded-lg font-black text-\[10px\] uppercase/g, 'text-white rounded-lg font-black text-[10px] uppercase'); 
htmlContent = htmlContent.replace(/text-postra-text cursor-pointer orb-glow/g, 'text-white cursor-pointer orb-glow'); 
htmlContent = htmlContent.replace(/bg-postra-blue text-postra-text rounded-xl/g, 'bg-postra-blue text-white rounded-xl'); 
fs.writeFileSync(path.join(dir, 'index.html'), htmlContent);

// 3. app.js changes
replaceInFile('app.js', [
  ['#ff4500', '#3b82f6'],
  ['postra-orange', 'postra-blue'],
  ['text-white', 'text-postra-text'], 
  ['bg-white/5', 'bg-postra-surface'],
  ['border-white/10', 'border-postra-border'],
  ['border-white/5', 'border-postra-border'],
  ['border-white/20', 'border-postra-border'],
  ['bg-black/80', 'bg-postra-text/20'],
  ['bg-black/95', 'bg-postra-text/30'],
  ['bg-[#0f0f0f]', 'bg-postra-surface'],
  ['bg-white/[0.02]', 'bg-postra-bg'],
  ['text-white/50', 'text-postra-muted'],
  ['text-white/40', 'text-postra-muted'],
  ['text-white/20', 'text-postra-muted/60'],
  ['text-white/30', 'text-postra-muted/40'],
  ['bg-white/10', 'bg-postra-border'],
  ['bg-white/30', 'bg-postra-border/60'],
  ['hover:bg-white/30', 'hover:bg-postra-border/60'],
  ['rgba(255,69,0', 'rgba(59,130,246'],
  ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.1)'],
  ['rgba(0,0,0,1)', 'rgba(0,0,0,0.2)'],
]);

let appContent = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
appContent = appContent.replace(/bg-postra-blue text-postra-text/g, 'bg-postra-blue text-white');
appContent = appContent.replace(/bg-green-500 text-postra-text/g, 'bg-green-500 text-white');
appContent = appContent.replace(/bg-red-500 text-postra-text/g, 'bg-red-500 text-white');
appContent = appContent.replace(/text-\[10px\] font-bold text-postra-text/g, 'text-[10px] font-bold text-white');
appContent = appContent.replace(/justify-center text-postra-text font-black text-4xl/g, 'justify-center text-white font-black text-4xl');
appContent = appContent.replace(/hover:text-postra-text/g, 'hover:text-postra-blue');
fs.writeFileSync(path.join(dir, 'app.js'), appContent);

console.log('Done replacement');
