import { createServer } from 'vite';

const server = await createServer({
  configFile: 'vite.config.js',
  server: { host: '127.0.0.1', port: 0, open: false, strictPort: false },
  logLevel: 'warn',
});
await server.listen();
const info = server.httpServer?.address();
console.log('httpServer.address =', JSON.stringify(info));
const base = `http://127.0.0.1:${info.port}`;
const res = await fetch(base + '/');
const body = await res.text();
console.log('GET / ->', res.status, body.length, 'bytes');
console.log('has #root:', body.includes('id="root"'));

if (typeof server.waitForRequestsIdle === 'function') {
  await server.waitForRequestsIdle();
  console.log('requests idle');
}

// Now the module graph is warm - fetch a real module.
const mod = await fetch(base + '/src/main.jsx');
console.log('GET /src/main.jsx ->', mod.status, mod.headers.get('content-type'));
const css = await fetch(base + '/src/styles/global.css');
console.log('GET /src/styles/global.css ->', css.status, css.headers.get('content-type'));
await server.close();
console.log('closed OK');
