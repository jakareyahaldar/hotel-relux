/**
 * CSS structure report.
 *
 * The previous version of this script treated any rule inside a `{ }` block as
 * corruption. That is wrong: rules inside `@media`, `@supports`, `@layer` and
 * `@keyframes` are perfectly legal, and the keyframe selectors inside
 * `@keyframes` (`from`, `to`, `50%`) are not style rules at all.
 *
 * This version does a real parse and only reports a rule as broken when it is
 * nested inside another *style rule*, which is the one case a plain CSS
 * parser silently drops.
 *
 * Run with:  node scripts/css-structure.mjs
 */
import fs from 'node:fs';

const CSS_FILE = 'src/styles/global.css';
const raw = fs.readFileSync(CSS_FILE, 'utf8');

// Blank out comments but keep every newline so line numbers stay correct.
const css = raw.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '));

// Index -> 1-based line number.
const lineStarts = [0];
for (let i = 0; i < css.length; i += 1) {
  if (css[i] === '\n') lineStarts.push(i + 1);
}
function lineAt(index) {
  let low = 0;
  let high = lineStarts.length - 1;
  while (low < high) {
    const mid = (low + high + 1) >> 1;
    if (lineStarts[mid] <= index) low = mid;
    else high = mid - 1;
  }
  return low + 1;
}

/** Find the `}` that closes the `{` at `openIndex`. */
function findBlockEnd(text, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Parse a block of CSS into nodes.
 * node.kind: 'rule' | 'atrule' | 'atrule-statement'
 */
function parseBlock(text, start, end) {
  const nodes = [];
  const declarations = [];
  let index = start;
  let buffer = '';
  let bufferStart = start;

  while (index < end) {
    const char = text[index];

    if (char === '{') {
      const prelude = buffer.trim();
      const preludeStart = bufferStart;
      buffer = '';
      const close = findBlockEnd(text, index);
      const stop = close === -1 ? end : close;
      const inner = parseBlock(text, index + 1, stop);
      const isAtRule = prelude.startsWith('@');
      nodes.push({
        kind: isAtRule ? 'atrule' : 'rule',
        prelude,
        name: isAtRule ? prelude.split(/[\s(]/)[0].toLowerCase() : null,
        start: preludeStart,
        end: stop,
        children: inner.nodes,
        declarations: inner.declarations,
      });
      index = stop + 1;
      bufferStart = index;
      continue;
    }

    if (char === ';') {
      const value = buffer.trim();
      if (value) {
        if (value.startsWith('@')) {
          nodes.push({ kind: 'atrule-statement', prelude: value, start: bufferStart, end: index });
        } else {
          declarations.push({ text: value, start: bufferStart, end: index });
        }
      }
      buffer = '';
      index += 1;
      bufferStart = index;
      continue;
    }

    if (!buffer) bufferStart = index;
    buffer += char;
    index += 1;
  }

  const tail = buffer.trim();
  if (tail) declarations.push({ text: tail, start: bufferStart, end });

  return { nodes, declarations };
}


const parsed = parseBlock(css, 0, css.length);

/* ------------------------------------------------------------------ */
/* 1. Rules nested inside another style rule (the real corruption)   */
/* ------------------------------------------------------------------ */

const broken = [];

function collectBroken(nodes) {
  for (const node of nodes) {
    if (node.kind === 'rule') {
      const nested = node.children.filter((child) => child.kind === 'rule');
      if (nested.length > 0) {
        broken.push({
          selector: node.prelude,
          start: lineAt(node.start),
          end: lineAt(node.end),
          nestedCount: nested.length,
        });
      }
    } else if (node.kind === 'atrule') {
      const name = node.name;
      // @keyframes / @font-face blocks contain keyframe steps or descriptors,
      // not style rules, so they are never "nested rules".
      if (name !== '@keyframes' && name !== '@font-face') {
        collectBroken(node.children);
      }
    }
  }
}
collectBroken(parsed.nodes);

console.log(`=== RULES NESTED INSIDE ANOTHER STYLE RULE (${broken.length}) ===`);
if (broken.length === 0) {
  console.log('  none - every style rule only contains declarations');
}
for (const b of broken) {
  console.log(`  lines ${b.start}-${b.end}  ${b.selector}  (${b.nestedCount} nested)`);
}

/* ------------------------------------------------------------------ */
/* 2. Unbalanced braces / unterminated blocks                        */
/* ------------------------------------------------------------------ */

let braceBalance = 0;
let minBalance = 0;
for (const char of css) {
  if (char === '{') braceBalance += 1;
  else if (char === '}') braceBalance -= 1;
  if (braceBalance < minBalance) minBalance = braceBalance;
}
const unbalanced = braceBalance !== 0 || minBalance < 0;

console.log(`\n=== BRACE BALANCE (${unbalanced ? 'BROKEN' : 'OK'}) ===`);
console.log(`  final depth: ${braceBalance}   lowest depth: ${minBalance}`);

/* ------------------------------------------------------------------ */
/* 3. At-rule inventory                                               */
/* ------------------------------------------------------------------ */

const atRules = [];
(function walk(nodes) {
  for (const node of nodes) {
    if (node.kind === 'atrule') {
      atRules.push({
        name: node.name,
        prelude: node.prelude.replace(/\s+/g, ' '),
        start: lineAt(node.start),
        childRules: node.children.filter((child) => child.kind === 'rule').length,
      });
      walk(node.children);
    }
  }
})(parsed.nodes);

console.log(`\n=== AT-RULES (${atRules.length}) ===`);
for (const at of atRules) {
  const params = at.prelude.slice(at.name.length).trim();
  const suffix = at.childRules ? `  (${at.childRules} rule(s))` : '';
  console.log(`  line ${String(at.start).padStart(5)}  ${at.name} ${params}${suffix}`);
}

/* ------------------------------------------------------------------ */
/* 4. Rule tree                                                       */
/* ------------------------------------------------------------------ */

function printNode(node, indent) {
  const pad = '  '.repeat(indent);
  const label = node.kind === 'atrule' ? `@${node.name}` : node.prelude;
  const text = label.replace(/\s+/g, ' ').slice(0, 80);
  const range = `[${lineAt(node.start)}-${lineAt(node.end)}]`;
  console.log(`${pad}${range} ${text}`);
  for (const child of node.children) printNode(child, indent + 1);
}

console.log('\n=== RULE TREE ===');
for (const node of parsed.nodes) printNode(node, 0);

/* ------------------------------------------------------------------ */
/* 5. Summary                                                         */
/* ------------------------------------------------------------------ */

const styleRules = [];
(function countRules(nodes) {
  for (const node of nodes) {
    if (node.kind === 'rule') styleRules.push(node);
    else if (node.kind === 'atrule') countRules(node.children);
  }
})(parsed.nodes);

const topLevel = parsed.nodes.filter((node) => node.kind === 'rule').length;

console.log('\n=== SUMMARY ===');
console.log(`  style rules (all levels): ${styleRules.length}`);
console.log(`  top-level style rules:    ${topLevel}`);
console.log(`  at-rules:                 ${atRules.length}`);
console.log(`  broken nested rules:      ${broken.length}`);
console.log(`  brace balance:            ${unbalanced ? 'BROKEN' : 'OK'}`);

const ok = broken.length === 0 && !unbalanced;
console.log(`\nRESULT: ${ok ? 'STRUCTURE OK' : 'STRUCTURE PROBLEMS FOUND'}`);
process.exit(ok ? 0 : 1);
