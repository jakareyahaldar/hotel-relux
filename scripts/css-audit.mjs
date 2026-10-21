import fs from 'node:fs';
import path from 'node:path';

const used = new Map();

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
      continue;
    }
    if (!/\.jsx?$/.test(entry) || /\.test\./.test(entry)) continue;
    const src = fs.readFileSync(full, 'utf8');
    const add = (raw) => {
      raw
        .replace(/\$\{[^}]*\}/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .forEach((c) => {
          if (!used.has(c)) used.set(c, new Set());
          used.get(c).add(full);
        });
    };
    let m;
    const staticRe = /className\s*=\s*["']([^"']*)["']/g;
    while ((m = staticRe.exec(src))) add(m[1]);
    const tmplRe = /className\s*=\s*\{`([^`]*)`\}/g;
    while ((m = tmplRe.exec(src))) add(m[1]);
  }
}

walk('src');

const css = fs.readFileSync('src/styles/global.css', 'utf8');
const defined = new Map();
const cre = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
let m;
while ((m = cre.exec(css))) {
  if (!defined.has(m[1])) defined.set(m[1], []);
  defined.get(m[1]).push(css.slice(0, m.index).split('\n').length);
}

const missing = [...used.keys()].filter((c) => !defined.has(c)).sort();
console.log(`=== CLASSES USED IN JSX BUT NOT DEFINED IN CSS (${missing.length}) ===`);
for (const c of missing) {
  console.log(`  .${c}   <- ${[...used.get(c)].join(', ')}`);
}

const unused = [...defined.keys()].filter((c) => !used.has(c)).sort();
console.log(`\n=== CSS CLASSES NOT USED IN JSX (${unused.length}) ===`);
console.log(unused.join('\n'));
