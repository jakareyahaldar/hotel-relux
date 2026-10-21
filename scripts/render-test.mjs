/**
 * Render smoke test.
 *
 * Boots a real Vite dev server, drives the installed Google Chrome in
 * headless mode over the DevTools Protocol, and asserts that the page
 * actually rendered.
 *
 * No Playwright / Puppeteer: Node >= 22 ships a global `fetch` and a global
 * `WebSocket`, which is everything the CDP transport needs.
 *
 * Run with:  npm run test:render
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].filter(Boolean);

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* Minimal Chrome DevTools Protocol client                            */
/* ------------------------------------------------------------------ */

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
        else resolve(message.result);
        return;
      }
      if (message.method) {
        for (const listener of this.listeners.get(message.method) || []) {
          listener(message.params || {});
        }
      }
    });
  }

  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const onOpen = () => { socket.removeEventListener('error', onError); resolve(); };
      const onError = () => { socket.removeEventListener('open', onOpen); reject(new Error('CDP socket error')); };
      socket.addEventListener('open', onOpen, { once: true });
      socket.addEventListener('error', onError, { once: true });
    });
    return new CdpClient(socket);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) payload.sessionId = sessionId;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(payload));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30000);
    });
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }

  close() {
    try { this.socket.close(); } catch { /* already closed */ }
  }
}

/* ------------------------------------------------------------------ */
/* Chrome launcher                                                    */
/* ------------------------------------------------------------------ */

async function launchChrome() {
  const executable = findChrome();
  if (!executable) {
    throw new Error('Google Chrome not found. Set CHROME_PATH to the chrome.exe location.');
  }

  const userDataDir = mkdtempSync(join(tmpdir(), 'aurelia-chrome-'));
  const child = spawn(
    executable,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-extensions',
      '--disable-background-networking',
      '--disable-dev-shm-usage',
      '--window-size=1440,900',
      '--remote-debugging-port=0',
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] },
  );

  let stderr = '';
  child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });

  const portFile = join(userDataDir, 'DevToolsActivePort');
  let endpoint = null;
  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (child.exitCode !== null) {
      throw new Error(`Chrome exited early (code ${child.exitCode}).\n${stderr.slice(-1500)}`);
    }
    try {
      const content = readFileSync(portFile, 'utf8');
      const [port, wsPath] = content.split('\n');
      if (port && wsPath) {
        const response = await fetch(`http://127.0.0.1:${port.trim()}/json/version`);
        if (response.ok) {
          const body = await response.json();
          endpoint = { port: port.trim(), wsPath: wsPath.trim(), browser: body.Browser };
          break;
        }
      }
    } catch {
      /* port file not written yet */
    }
    await sleep(200);
  }

  if (!endpoint) {
    child.kill();
    throw new Error(`Chrome did not expose a DevTools port.\n${stderr.slice(-1500)}`);
  }

  return {
    child,
    endpoint,
    userDataDir,
    cleanup() {
      try { child.kill(); } catch { /* already gone */ }
      try {
        rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
      } catch { /* best effort */ }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Vite dev server                                                    */
/* ------------------------------------------------------------------ */

async function startVite() {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: 'vite.config.js',
    server: { host: '127.0.0.1', port: 0, open: false, strictPort: false },
    logLevel: 'error',
  });
  await server.listen();
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    await server.close();
    throw new Error('Vite did not report a TCP address.');
  }
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    async close() {
      try { await server.close(); } catch { /* already closed */ }
    },
  };
}

/* ------------------------------------------------------------------ */
/* Assertions                                                         */
/* ------------------------------------------------------------------ */

/**
 * Each check is evaluated inside the page, so it sees the real rendered
 * DOM rather than the JSX source.
 */
const CHECKS = [
  { name: 'app root rendered', expression: `!!document.querySelector('.app')` },
  { name: 'header present', expression: `!!document.querySelector('.header')` },
  { name: 'header brand name', expression: `(document.querySelector('.header__brand-name')?.textContent || '').trim().length > 0` },
  { name: 'hero heading', expression: `(document.querySelector('.hero__title')?.textContent || '').includes('Thirteen rooms')` },
  { name: 'hero stats rendered', expression: `document.querySelectorAll('.hero__stat-value').length === 4` },
  { name: 'booking bar present', expression: `!!document.querySelector('.bookbar')` },
  { name: 'booking dates prefilled', expression: `!!document.querySelector('#bar-checkin')?.value && !!document.querySelector('#bar-checkout')?.value` },
  { name: 'booking guest select is controlled', expression: `document.querySelector('#bar-guests')?.value === '2'` },
  { name: 'booking room type select is controlled', expression: `document.querySelector('#bar-room')?.value === 'all'` },
  { name: 'availability pill rendered', expression: `!!document.querySelector('.bookbar__availability .pill')` },
  { name: 'rooms section present', expression: `!!document.querySelector('#rooms')` },
  { name: 'room cards rendered', expression: `document.querySelectorAll('.room-card').length > 0` },
  { name: 'rooms availability counter rendered', expression: `(document.querySelector('.rooms__count')?.textContent || '').includes('13 of 13')` },
  { name: 'room type filter chips rendered', expression: `document.querySelectorAll('.rooms__filters .filter-chip').length === 4` },
  { name: 'the "all rooms" chip starts active', expression: `(() => { const chip = [...document.querySelectorAll('.filter-chip')].find((b) => b.textContent.trim() === 'All rooms'); return !!chip && chip.classList.contains('filter-chip--active'); })()` },
  { name: 'footer present', expression: `!!document.querySelector('.footer')` },
  { name: 'footer contact links', expression: `document.querySelectorAll('.footer__contact-item').length >= 3` },
  { name: 'floating action buttons', expression: `document.querySelectorAll('.fab-stack .fab').length === 2` },
  { name: 'stylesheet applied', expression: `getComputedStyle(document.body).margin === '0px'` },
  { name: 'no horizontal overflow', expression: `document.documentElement.scrollWidth <= window.innerWidth + 1` },
];

/**
 * The booking flow is the site's primary conversion path, so it gets its own
 * end-to-end pass: open the modal from the header, fill the form, submit it
 * and confirm the receipt. These run in order and depend on each other.
 */
const BOOKING_STEPS = [
  {
    name: 'header "Book a room" button is visible',
    expression: `(() => {
      const b = [...document.querySelectorAll('button')].find(
        (x) => x.textContent.trim() === 'Book a room' && x.closest('.header'),
      );
      if (!b) return false;
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden';
    })()`,
  },
  {
    name: 'clicking "Book a room" opens the booking modal',
    expression: `(() => {
      const b = [...document.querySelectorAll('button')].find(
        (x) => x.textContent.trim() === 'Book a room' && x.closest('.header'),
      );
      if (!b) return false;
      b.click();
      return true;
    })()`,
    settle: 600,
  },
  {
    name: 'booking modal renders the form step',
    expression: `!!document.querySelector('.modal-backdrop') && !!document.querySelector('.modal__title') && !!document.querySelector('#guest-name') && !!document.querySelector('#guest-phone')`,
  },
  {
    name: 'booking modal traps page scroll',
    expression: `document.body.classList.contains('no-scroll') && getComputedStyle(document.body).overflow === 'hidden'`,
  },
  {
    name: 'guest details can be entered',
    expression: `(() => {
      const setValue = (sel, value) => {
        const el = document.querySelector(sel);
        if (!el) return false;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
      };
      return setValue('#guest-name', 'Priya Raghunathan')
        && setValue('#guest-phone', '+91 98765 43210')
        && setValue('#guest-email', 'priya@example.com');
    })()`,
    settle: 300,
  },
  {
    name: 'booking form accepts the details',
    expression: `document.querySelector('#guest-name')?.value === 'Priya Raghunathan' && document.querySelector('#guest-phone')?.value === '+91 98765 43210'`,
  },
  {
    name: 'confirm button is reachable by the user',
    expression: `(() => {
      const backdrop = document.querySelector('.modal-backdrop');
      const submit = document.querySelector('.modal__foot button[type="submit"]');
      if (!backdrop || !submit) return false;
      backdrop.scrollTop = backdrop.scrollHeight;
      const r = submit.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight) return false;
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return top === submit || submit.contains(top);
    })()`,
  },
  {
    name: 'booking can be submitted',
    expression: `(() => {
      const submit = document.querySelector('.modal__foot button[type="submit"]');
      if (!submit) return false;
      submit.click();
      return true;
    })()`,
    settle: 900,
  },
  {
    name: 'booking confirmation shows a reference',
    expression: `/^AUR-[A-Z0-9]{6}$/.test((document.querySelector('.reference__value')?.textContent || '').trim())`,
  },
  {
    name: 'confirmation WhatsApp link carries the booking message',
    expression: `(() => {
      const href = document.querySelector('.modal a.btn--whatsapp')?.getAttribute('href') || '';
      return href.startsWith('https://wa.me/') && href.includes('text=');
    })()`,
  },
  {
    name: 'booking is persisted to localStorage',
    expression: `(() => {
      try {
        const list = JSON.parse(localStorage.getItem('aurelia.bookings.v1') || '[]');
        return Array.isArray(list) && list.length > 0 && list[0].status === 'pending';
      } catch {
        return false;
      }
    })()`,
  },
];

/* ------------------------------------------------------------------ */
/* Runner                                                             */
/* ------------------------------------------------------------------ */

let vite = null;
let chrome = null;
let client = null;

function report(message) {
  console.log(message);
}

try {
  report('==> starting Vite dev server');
  vite = await startVite();
  report(`    ${vite.url}`);

  report('==> launching headless Chrome');
  chrome = await launchChrome();
  report(`    ${chrome.endpoint.browser}`);

  const wsUrl = `ws://127.0.0.1:${chrome.endpoint.port}${chrome.endpoint.wsPath}`;
  client = await CdpClient.connect(wsUrl);

  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  const consoleErrors = [];
  const pageErrors = [];

  client.on('Runtime.consoleAPICalled', (params) => {
    if (params.type !== 'error' && params.type !== 'warning') return;
    const text = (params.args || [])
      .map((arg) => arg.value ?? arg.description ?? arg.unserializableValue ?? '')
      .join(' ');
    consoleErrors.push(`[console.${params.type}] ${text}`);
  });
  client.on('Runtime.exceptionThrown', (params) => {
    const details = params.exceptionDetails || {};
    const text = details.exception?.description || details.text || 'unknown exception';
    pageErrors.push(`[exception] ${text}`);
  });
  client.on('Log.entryAdded', (params) => {
    const entry = params.entry || {};
    if (entry.level === 'error') consoleErrors.push(`[log] ${entry.text}`);
  });

  await client.send('Runtime.enable', {}, sessionId);
  await client.send('Page.enable', {}, sessionId);
  await client.send('Log.enable', {}, sessionId);

  report(`==> navigating to ${vite.url}`);
  const loaded = new Promise((resolve) => {
    client.on('Page.loadEventFired', () => resolve(true));
  });
  await client.send('Page.navigate', { url: vite.url }, sessionId);
  await Promise.race([loaded, sleep(20000)]);

  // Wait for React to mount the header.
  let mounted = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { result } = await client.send(
      'Runtime.evaluate',
      { expression: `!!document.querySelector('.app .header')`, returnByValue: true },
      sessionId,
    );
    if (result.value === true) { mounted = true; break; }
    await sleep(150);
  }
  assert.ok(mounted, 'React did not mount the header within 15s.');
  report('    react mounted');

  // Give lazy images / reveal observers a moment to settle.
  await sleep(600);

  report('\n==> checking rendered DOM');
  const failures = [];
  for (const check of CHECKS) {
    const { result } = await client.send(
      'Runtime.evaluate',
      {
        expression: `(() => { try { return !!(${check.expression}); } catch (e) { return false; } })()`,
        returnByValue: true,
      },
      sessionId,
    );
    const passed = result.value === true;
    report(`    ${passed ? 'PASS' : 'FAIL'}  ${check.name}`);
    if (!passed) failures.push(check.name);
  }

  report('\n==> walking the booking flow');
  for (const step of BOOKING_STEPS) {
    const { result } = await client.send(
      'Runtime.evaluate',
      {
        expression: `(() => { try { return !!(${step.expression}); } catch (e) { return false; } })()`,
        returnByValue: true,
      },
      sessionId,
    );
    const passed = result.value === true;
    report(`    ${passed ? 'PASS' : 'FAIL'}  ${step.name}`);
    if (!passed) failures.push(step.name);
    if (step.settle) await sleep(step.settle);
  }

  // Layout probe: report measured boxes so a reviewer can see the page is
  // actually laid out and not a stack of unstyled nodes.
  const { result: layout } = await client.send(
    'Runtime.evaluate',
    {
      expression: `(() => {
        const pick = (sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) };
        };
        return JSON.stringify({
          app: pick('.app'),
          header: pick('.header'),
          hero: pick('.hero'),
          bookbar: pick('.bookbar'),
          rooms: pick('#rooms'),
          footer: pick('.footer'),
          fab: pick('.fab-stack'),
          docHeight: document.documentElement.scrollHeight
        });
      })()`,
      returnByValue: true,
    },
    sessionId,
  );
  report(`\n==> layout boxes\n    ${layout.value}`);

  report('\n==> console / runtime output');
  if (consoleErrors.length === 0 && pageErrors.length === 0) {
    report('    no console errors, no uncaught exceptions');
  }
  for (const line of pageErrors) report(`    ${line}`);
  for (const line of consoleErrors) report(`    ${line}`);

  console.log('\n=== SUMMARY ===');
  const totalChecks = CHECKS.length + BOOKING_STEPS.length;
  console.log(`  checks passed: ${totalChecks - failures.length}/${totalChecks}`);
  console.log(`    DOM checks: ${CHECKS.length - failures.filter((f) => !BOOKING_STEPS.some((s) => s.name === f)).length}/${CHECKS.length}`);
  console.log(`    booking flow: ${BOOKING_STEPS.length - failures.filter((f) => BOOKING_STEPS.some((s) => s.name === f)).length}/${BOOKING_STEPS.length}`);
  console.log(`  uncaught exceptions: ${pageErrors.length}`);
  console.log(`  console errors/warnings: ${consoleErrors.length}`);

  if (failures.length > 0) {
    console.log('\nFAILED CHECKS:');
    for (const failure of failures) console.log(`  - ${failure}`);
  }

  const ok = failures.length === 0 && pageErrors.length === 0;
  console.log(`\nRESULT: ${ok ? 'RENDER OK' : 'RENDER FAILED'}`);
  process.exitCode = ok ? 0 : 1;
} catch (error) {
  console.error(`\nRESULT: RENDER ERRORED\n${error.stack || error.message}`);
  process.exitCode = 1;
} finally {
  if (client) client.close();
  if (chrome) chrome.cleanup();
  if (vite) await vite.close();
}





