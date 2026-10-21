/**
 * CSS validation + corruption report.
 *
 * Uses PostCSS (already present via Vite) to parse the stylesheet and report:
 *   1. Rules that illegally contain nested rules (a CSS parser drops these).
 *   2. Declarations with malformed values.
 *   3. Selectors that are never used by the JSX.
 *
 * Run with:  node scripts/css-validate.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import postcss from 'postcss';

const CSS_FILE = 'src/styles/global.css';
const css = fs.readFileSync(CSS_FILE, 'utf8');

let root;
try {
  root = postcss.parse(css, { from: CSS_FILE });
  console.log('PostCSS parse: OK');
} catch (error) {
  console.error(`PostCSS parse FAILED: ${error.message}`);
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* 1. Rules that contain nested rules                                  */
/* ------------------------------------------------------------------ */

const containers = [];
root.walkRules((rule) => {
  const nested = rule.nodes.filter((node) => node.type === 'rule');
  if (nested.length > 0) {
    containers.push({
      selector: rule.selector,
      start: rule.source.start.line,
      end: rule.source.end.line,
      nestedCount: nested.length,
    });
  }
});

console.log(`\n=== RULES CONTAINING NESTED RULES (${containers.length}) ===`);
for (const c of containers) {
  console.log(`  lines ${c.start}-${c.end}  ${c.selector}  (${c.nestedCount} nested)`);
}

/* ------------------------------------------------------------------ */
/* 2. Malformed declarations                                            */
/* ------------------------------------------------------------------ */

const badDeclarations = [];
root.walkDecls((decl) => {
  const value = decl.value.trim();
  if (value === '') {
    badDeclarations.push({ line: decl.source.start.line, prop: decl.prop, reason: 'empty value' });
    return;
  }
  if (/var\(--[\w-]*$/.test(value) || /\w\($/.test(value)) {
    badDeclarations.push({ line: decl.source.start.line, prop: decl.prop, reason: `dangling value "${value}"` });
  }
  if (!/^[-a-zA-Z]+$/.test(decl.prop)) {
    badDeclarations.push({ line: decl.source.start.line, prop: decl.prop, reason: 'malformed property' });
  }
});

console.log(`\n=== SUSPICIOUS DECLARATIONS (${badDeclarations.length}) ===`);
for (const d of badDeclarations) {
  console.log(`  line ${d.line}  ${d.prop}  ->  ${d.reason}`);
}

/* ------------------------------------------------------------------ */
/* 3. Orphaned declaration blocks (declarations directly under a rule   */
/*    that also contains nested rules - the corruption signature)        */
/* ------------------------------------------------------------------ */

console.log('\n=== DECLARATION SHAPE OF EACH CORRUPTED RULE ===');
for (const c of containers) {
  root.walkRules((rule) => {
    if (rule.source.start.line !== c.start) return;
    const decls = rule.nodes.filter((node) => node.type === 'decl');
    const kids = rule.nodes.filter((node) => node.type === 'rule');
    const firstKidIndex = rule.nodes.indexOf(kids[0]);
    const lastKidIndex = rule.nodes.indexOf(kids[kids.length - 1]);
    const leading = rule.nodes.slice(0, firstKidIndex).filter((n) => n.type === 'decl');
    const trailing = rule.nodes.slice(lastKidIndex + 1).filter((n) => n.type === 'decl');
    console.log(`\n  ${rule.selector}  (${rule.source.start.line}-${rule.source.end.line})`);
    console.log(
      `    leading decls (${leading.length}): ` +
        leading.map((d) => `${d.prop}: ${d.value}`).join('; '),
    );
    console.log(
      `    trailing decls (${trailing.length}): ` +
        trailing.map((d) => `${d.prop}: ${d.value}`).join('; '),
    );
  });
}

/* ------------------------------------------------------------------ */
/* 4. Class coverage                                                    */
/* ------------------------------------------------------------------ */

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
        .split(/\s+/)
        .filter(Boolean)
        .forEach((c) => {
          if (!used.has(c)) used.set(c, new Set());
          used.get(c).add(full);
        });
    };
    let m;
    // className="a b"  /  className={'a b'}
    const staticRe = /className\s*=\s*["']([^"']*)["']/g;
    while ((m = staticRe.exec(src))) add(m[1]);
    // className={`a ${cond ? 'b' : 'c'}`} - keep the literal parts of the
    // template AND any string literal used inside the ${...} expressions.
    // The template may be followed by a method call such as `.trim()`.
    const tmplRe = /className\s*=\s*\{`([^`]*)`[^}]*\}/g;
    while ((m = tmplRe.exec(src))) {
      const template = m[1];
      const withoutExpr = template.replace(/\$\{[^}]*\}/g, ' ');
      add(withoutExpr);
      for (const expr of template.matchAll(/\$\{([^}]*)\}/g)) {
        for (const lit of expr[1].matchAll(/["']([^"']*)["']/g)) add(lit[1]);
      }
    }
    // classList.add('a') / .remove('a') / .toggle('a', cond)
    const listRe = /classList\.(?:add|remove|toggle)\(\s*["']([^"']+)["']/g;
    while ((m = listRe.exec(src))) add(m[1]);
  }
}
walk('src');

const defined = new Set();
root.walkRules((rule) => {
  for (const match of rule.selector.matchAll(/\.([a-zA-Z][a-zA-Z0-9_-]*)/g)) {
    defined.add(match[1]);
  }
});

const missing = [...used.keys()].filter((c) => !defined.has(c)).sort();
console.log(`\n=== JSX CLASSES WITH NO CSS RULE (${missing.length}) ===`);
for (const c of missing) console.log(`  .${c}`);

const unused = [...defined].filter((c) => !used.has(c)).sort();
console.log(`\n=== CSS CLASSES NEVER USED IN JSX (${unused.length}) ===`);
console.log(unused.join(', '));

const failed = containers.length > 0 || badDeclarations.length > 0 || missing.length > 0;
console.log(`\nRESULT: ${failed ? 'ISSUES FOUND' : 'CLEAN'}`);
process.exit(failed ? 1 : 0);
