// Test-only isolation: never load user dotenv files or reuse an external server.
const assert = require('node:assert/strict');
function installOfflineTestEnvironment() {
  if (process.env.SERVER_URL) {
    const url = new URL(process.env.SERVER_URL);
    assert(['localhost', '127.0.0.1', '[::1]'].includes(url.hostname), 'Tests refuse a non-loopback SERVER_URL');
  }
  for (const name of Object.keys(process.env)) {
    if (/^(SUPABASE_|IP_SALT$|ALLOWED_ORIGINS$|TRUSTED_PROXIES$)/.test(name)) delete process.env[name];
  }
  process.env.NODE_ENV = 'test';
  // Existing jail fixtures use distinct synthetic XFF addresses behind this LOCAL proxy.
  process.env.TRUSTED_PROXIES = '127.0.0.1/32,::1/128';
  require('dotenv').config = () => ({ parsed: {} });
  const sdkPath = require.resolve('@supabase/supabase-js');
  require.cache[sdkPath] = { id: sdkPath, filename: sdkPath, loaded: true, exports: {
    createClient() { throw new Error('Real Supabase SDK forbidden in local suite'); }
  }};
}
async function startLocalServer(serverModule) {
  const server = serverModule.server;
  assert(!server.listening, 'Tests must own a fresh local server');
  await new Promise((resolve, reject) => {
    const onError = error => { clearTimeout(timer); reject(error); };
    const timer = setTimeout(() => reject(new Error('Timed out after 3000ms starting local test server')), 3000);
    server.once('error', onError);
    server.listen(0, '127.0.0.1', () => {
      clearTimeout(timer);
      server.off('error', onError);
      resolve();
    });
  });
  return 'http://127.0.0.1:' + server.address().port;
}
async function closeLocalServer(serverModule) {
  if (!serverModule) return;
  clearInterval(serverModule.statsBroadcastTimer);
  for (const room of serverModule.rooms.values()) clearInterval(room.timerInterval);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Timed out after 3000ms closing local test server')), 3000);
    serverModule.io.close(() => { clearTimeout(timer); resolve(); });
  });
  serverModule.server.closeAllConnections();
}
async function fetchLocalJson(base, suffix, includeStatus = false) {
  const response = await fetch(base + suffix, { signal: AbortSignal.timeout(3000) });
  const body = await response.json();
  return includeStatus ? { status: response.status, body } : body;
}
module.exports = { installOfflineTestEnvironment, startLocalServer, closeLocalServer, fetchLocalJson };
