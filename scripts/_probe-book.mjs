/**
 * Temporary probe: click the header "Book a room" button and report what
 * actually happens in the DOM.
 */
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function findChrome() {
  for (const candidate of CHROME_CANDIDATES) if (existsSync(candidate)) return candidate;
  return null;
}

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => {
      let message;
      try { message = JSON.parse(event.data); } catch { return; }
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id);
        this.pending.delete(message.id);
        if (message.error) reject(new Error(message.error.message));
        else resolve(message.result);
        return;
      }
      if (message.method) {
        for (const l of this.listeners.get(message.method) || []) l(message.params || {});
      }
    });
  }
  static async connect(url) {
    const socket = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const onOpen = () => { socket.removeEventListener('error', onError); resolve(); };
      const onError = () => { socket.removeEventListener('open', onOpen); reject(new Error('socket error')); };
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
        if (this.pending.has(id)) { this.pending.delete(id); reject(new Error(`timeout ${method}`)); }
      }, 30000);
    });
  }
  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, []);
    this.listeners.get(method).push(listener);
  }
  close() { try { this.socket.close(); } catch { /* noop */ } }
}


async function launchChrome() {
  const executable = findChrome();
  if (!executable) throw new Error('chrome not found');
  const userDataDir = mkdtempSync(join(tmpdir(), 'aurelia-probe-'));
  const child = spawn(executable, [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--disable-dev-shm-usage',
    '--window-size=1440,900', '--remote-debugging-port=0', `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', (c) => { stderr += c.toString(); });
  const portFile = join(userDataDir, 'DevToolsActivePort');
  for (let i = 0; i < 150; i += 1) {
    if (child.exitCode !== null) throw new Error(`chrome exited ${child.exitCode}\n${stderr.slice(-1000)}`);
    try {
      const content = readFileSync(portFile, 'utf8');
      const [port, wsPath] = content.split('\n');
      if (port && wsPath) {
        const res = await fetch(`http://127.0.0.1:${port.trim()}/json/version`);
        if (res.ok) {
          const body = await res.json();
          return {
            child, port: port.trim(), wsPath: wsPath.trim(), browser: body.Browser, userDataDir,
            cleanup() {
              try { child.kill(); } catch { /* noop */ }
              try { rmSync(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 }); } catch { /* noop */ }
            },
          };
        }
      }
    } catch { /* not ready */ }
    await sleep(200);
  }
  child.kill();
  throw new Error(`no devtools port\n${stderr.slice(-1000)}`);
}

async function startVite() {
  const { createServer } = await import('vite');
  const server = await createServer({
    configFile: 'vite.config.js',
    server: { host: '127.0.0.1', port: 0, open: false, strictPort: false },
    logLevel: 'error',
  });
  await server.listen();
  const address = server.httpServer?.address();
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    close: async () => { try { await server.close(); } catch { /* noop */ } },
  };
}

let vite = null;
let chrome = null;
let client = null;

try {
  vite = await startVite();
  console.log('vite:', vite.url);
  chrome = await launchChrome();
  console.log('chrome:', chrome.browser);

  client = await CdpClient.connect(`ws://127.0.0.1:${chrome.port}${chrome.wsPath}`);
  const { targetId } = await client.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await client.send('Target.attachToTarget', { targetId, flatten: true });

  const logs = [];
  client.on('Runtime.consoleAPICalled', (p) => {
    logs.push(`[console.${p.type}] ` + (p.args || []).map((a) => a.value ?? a.description ?? '').join(' '));
  });
  client.on('Runtime.exceptionThrown', (p) => {
    logs.push('[exception] ' + (p.exceptionDetails?.exception?.description || p.exceptionDetails?.text));
  });

  await client.send('Runtime.enable', {}, sessionId);
  await client.send('Page.enable', {}, sessionId);
  await client.send('Page.navigate', { url: vite.url }, sessionId);
  await sleep(3500);

  const evaluate = async (expression) => {
    const { result, exceptionDetails } = await client.send('Runtime.evaluate',
      { expression, returnByValue: true, awaitPromise: true }, sessionId);
    if (exceptionDetails) return { error: exceptionDetails.exception?.description || exceptionDetails.text };
    return { value: result.value };
  };

  // 1. Locate every "Book a room" button.
  console.log('\n--- 1. locate buttons ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim().toLowerCase() === 'book a room');
      return btns.map(b => {
        const r = b.getBoundingClientRect();
        const cs = getComputedStyle(b);
        return {
          cls: b.className,
          rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
          display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
          pointerEvents: cs.pointerEvents,
          bg: cs.backgroundColor, color: cs.color,
          inHeader: !!b.closest('.header'),
          disabled: b.disabled,
        };
      });
    })()
  `), null, 2));

  // 2. What is on top of the button?
  console.log('\n--- 2. hit test at button centre ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().toLowerCase() === 'book a room' && x.closest('.header'));
      if (!b) return 'no header button';
      const r = b.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const top = document.elementFromPoint(cx, cy);
      return {
        cx: Math.round(cx), cy: Math.round(cy),
        topTag: top?.tagName,
        topCls: String(top?.className || ''),
        isTheButton: top === b || b.contains(top),
        topText: (top?.textContent || '').trim().slice(0, 40),
      };
    })()
  `), null, 2));

  // 3. Click it and observe.
  console.log('\n--- 3. click ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().toLowerCase() === 'book a room' && x.closest('.header'));
      if (!b) return 'no header button';
      b.click();
      return 'clicked';
    })()
  `), null, 2));

  await sleep(1200);

  console.log('\n--- 4. state after click ---');
  console.log(JSON.stringify(await evaluate(`
    (() => ({
      modalBackdrop: !!document.querySelector('.modal-backdrop'),
      modalTitle: (document.querySelector('.modal__title')?.textContent || '').trim(),
      modalSubtitle: (document.querySelector('.modal__subtitle')?.textContent || '').trim(),
      toast: (document.querySelector('.toast')?.textContent || '').trim(),
      bodyHasNoScroll: document.body.classList.contains('no-scroll'),
      dialogs: document.querySelectorAll('[role="dialog"]').length,
    }))()
  `), null, 2));

  // 4b. Fill the booking form.
  console.log('\n--- 4b. fill form ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const setValue = (sel, value) => {
        const el = document.querySelector(sel);
        if (!el) return 'missing ' + sel;
        const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
          : el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
        setter.call(el, value);
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        return 'ok';
      };
      return {
        name: setValue('#guest-name', 'Priya Raghunathan'),
        phone: setValue('#guest-phone', '+91 98765 43210'),
        email: setValue('#guest-email', 'priya@example.com'),
      };
    })()
  `), null, 2));

  await sleep(400);

  // 4c. Scroll the modal backdrop so the submit button is in view, then hit test.
  console.log('\n--- 4c. scroll modal + reach submit ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const backdrop = document.querySelector('.modal-backdrop');
      const submit = document.querySelector('.modal__foot button[type="submit"]');
      if (!backdrop || !submit) return 'missing elements';
      backdrop.scrollTop = backdrop.scrollHeight;
      const sr = submit.getBoundingClientRect();
      const top = document.elementFromPoint(sr.x + sr.width / 2, sr.y + sr.height / 2);
      return {
        backdropScrolled: Math.round(backdrop.scrollTop),
        submitRect: { x: Math.round(sr.x), y: Math.round(sr.y), w: Math.round(sr.width), h: Math.round(sr.height) },
        submitText: submit.textContent.trim(),
        submitVisible: sr.top >= 0 && sr.bottom <= window.innerHeight,
        hitIsButton: top === submit || submit.contains(top),
        hitTag: top?.tagName,
      };
    })()
  `), null, 2));

  await sleep(300);

  // 5. Submit the booking.
  console.log('\n--- 5. submit booking ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const submit = document.querySelector('.modal__foot button[type="submit"]');
      if (!submit) return 'no submit';
      submit.click();
      return 'submitted';
    })()
  `), null, 2));

  await sleep(1500);

  console.log('\n--- 6. confirmation step ---');
  console.log(JSON.stringify(await evaluate(`
    (() => {
      const wa = document.querySelector('.modal a.btn--whatsapp');
      const call = document.querySelector('.modal a.btn--call');
      return {
        modalTitle: (document.querySelector('.modal__title')?.textContent || '').trim(),
        modalSubtitle: (document.querySelector('.modal__subtitle')?.textContent || '').trim(),
        successTitle: (document.querySelector('.success__title')?.textContent || '').trim(),
        reference: (document.querySelector('.reference__value')?.textContent || '').trim(),
        whatsappHref: wa?.getAttribute('href') || null,
        whatsappHrefValid: (wa?.getAttribute('href') || '').startsWith('https://wa.me/'),
        whatsappHasText: (wa?.getAttribute('href') || '').includes('text='),
        callHref: call?.getAttribute('href') || null,
        toast: (document.querySelector('.toast')?.textContent || '').trim(),
        storedBookings: (JSON.parse(localStorage.getItem('aurelia.bookings.v1') || '[]')).length,
      };
    })()
  `), null, 2));

  // 6b. Escape closes the modal.
  console.log('\n--- 6b. escape closes modal ---');
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
  }, sessionId);
  await client.send('Input.dispatchKeyEvent', {
    type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27,
  }, sessionId);
  await sleep(600);
  console.log(JSON.stringify(await evaluate(`
    (() => ({
      modalBackdrop: !!document.querySelector('.modal-backdrop'),
      bodyHasNoScroll: document.body.classList.contains('no-scroll'),
    }))()
  `), null, 2));

  console.log('\n--- 7. console logs ---');
  console.log(logs.length ? logs.join('\n') : '(none)');

} catch (error) {
  console.error('PROBE ERROR:', error.stack || error.message);
} finally {
  if (client) client.close();
  if (chrome) chrome.cleanup();
  if (vite) await vite.close();
}
