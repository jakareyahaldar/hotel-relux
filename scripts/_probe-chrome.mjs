import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = await mkdtemp(join(tmpdir(), 'chrome-probe-'));
const child = spawn(CHROME, [
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-dev-shm-usage',
  '--remote-debugging-port=0',
  `--user-data-dir=${userDataDir}`,
  'about:blank',
], { stdio: ['ignore', 'pipe', 'pipe'] });

let stderr = '';
child.stderr.on('data', (d) => { stderr += d.toString(); });
child.on('exit', (code) => console.log('CHROME EXITED code=', code, stderr.slice(-800)));

const portFile = join(userDataDir, 'DevToolsActivePort');
let found = false;
for (let i = 0; i < 100; i++) {
  try {
    const content = await readFile(portFile, 'utf8');
    const [port, wsPath] = content.split('\n');
    const res = await fetch(`http://127.0.0.1:${port.trim()}/json/version`);
    const body = await res.json();
    console.log('OK port=', port.trim());
    console.log('wsPath=', wsPath);
    console.log('version=', body.Browser);
    found = true;
    break;
  } catch (e) {
    await new Promise((r) => setTimeout(r, 200));
  }
}
if (!found) console.log('FAILED to find DevToolsActivePort. stderr=', stderr.slice(-1500));
child.kill();
await new Promise((r) => setTimeout(r, 1500));
try {
  await rm(userDataDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 300 });
  console.log('cleanup OK');
} catch (e) {
  console.log('cleanup skipped:', e.code);
}
