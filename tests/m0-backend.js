'use strict';

// This suite never loads .env or a real Supabase SDK. Every storage operation is
// recorded by a local fake; every HTTP/Socket.IO connection targets loopback.
const assert = require('node:assert/strict');
const http = require('node:http');
const Module = require('node:module');
const { io: Client } = require('socket.io-client');

const ENV_NAMES = ['NODE_ENV', 'ALLOWED_ORIGINS', 'TRUSTED_PROXIES', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'IP_SALT'];
const savedEnv = new Map(ENV_NAMES.map(name => [name, process.env[name]]));
const syntheticConfig = {
  NODE_ENV: 'production', ALLOWED_ORIGINS: '', TRUSTED_PROXIES: '',
  SUPABASE_URL: 'https://synthetic.invalid',
  SUPABASE_SERVICE_ROLE_KEY: 'synthetic-service-key',
  SUPABASE_ANON_KEY: '', IP_SALT: 'synthetic-test-salt-only'
};
Object.assign(process.env, syntheticConfig);

const storageCalls = [];
const sdkInitializations = [];
let failStorage = false;
const fakeSdk = {
  createClient(url, key) {
    assert.equal(url, syntheticConfig.SUPABASE_URL, 'Only the synthetic SDK URL may be used');
    assert.equal(key, syntheticConfig.SUPABASE_SERVICE_ROLE_KEY, 'Only the synthetic service key may be used');
    sdkInitializations.push({ url, key });
    return {
      from(table) {
        storageCalls.push({ method: 'from', table });
        const query = {
          values: null,
          insert(values) {
            this.values = values;
            storageCalls.push({ method: 'insert', table, values });
            return this;
          },
          select() { storageCalls.push({ method: 'select', table }); return this; },
          eq() { return this; }, order() { return this; }, limit() { return this; },
          then(resolve, reject) {
            return Promise.resolve({
              data: this.values || [],
              error: failStorage ? { message: 'SDK_PRIVATE_TEXT_MUST_NOT_REACH_LOGS' } : null
            }).then(resolve, reject);
          }
        };
        return query;
      }
    };
  }
};
const originalLoad = Module._load;
Module._load = function(name, parent, isMain) {
  if (name === 'dotenv') return { config() { return {}; } };
  if (name === '@supabase/supabase-js') return fakeSdk;
  return originalLoad.call(this, name, parent, isMain);
};

let backend;
let passed = 0;
const clients = new Set();
const requests = new Set();
const timers = new Set();
let baseUrl;
const TIMEOUT_MS = 2000;

function withTimeout(promise, description) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Timed out after ${TIMEOUT_MS}ms: ${description}`)), TIMEOUT_MS);
    timers.add(timer);
  });
  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timer);
    timers.delete(timer);
  });
}

function event(socket, name) {
  let handler;
  const promise = new Promise(resolve => {
    handler = resolve;
    socket.once(name, handler);
  });
  return withTimeout(promise, name).finally(() => socket.off(name, handler));
}

async function connect({ transport = 'websocket', origin, headers = {}, rejectOrigin = false } = {}) {
  const client = Client(baseUrl, {
    transports: [transport], reconnection: false, forceNew: true, autoConnect: false,
    timeout: TIMEOUT_MS, extraHeaders: { ...headers, ...(origin === undefined ? {} : { Origin: origin }) }
  });
  clients.add(client);
  let onConnect;
  let onError;
  const outcome = new Promise(resolve => {
    onConnect = () => resolve('connect');
    onError = () => resolve('connect_error');
    client.once('connect', onConnect);
    client.once('connect_error', onError);
  });
  client.connect();
  try {
    assert.equal(await withTimeout(outcome, `${transport} handshake`), rejectOrigin ? 'connect_error' : 'connect');
    return client;
  } finally {
    client.off('connect', onConnect);
    client.off('connect_error', onError);
    if (rejectOrigin) client.disconnect();
  }
}

function request(pathname, origin) {
  return new Promise((resolve, reject) => {
    const target = new URL(pathname, baseUrl);
    assert.equal(target.hostname, '127.0.0.1', 'HTTP tests must stay on loopback');
    const req = http.get(target, {
      headers: origin === undefined ? {} : { Origin: origin },
      agent: false
    }, res => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => {
        requests.delete(req);
        try { resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) }); }
        catch (error) { reject(error); }
      });
      res.on('error', reject);
    });
    requests.add(req);
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error('Timed out waiting for local HTTP response')));
    req.on('error', error => { requests.delete(req); reject(error); });
  });
}

async function check(description, action) {
  await action();
  passed++;
  console.log(`[PASS] ${description}`);
}

async function run() {
  try {
    backend = require('../server');
    await withTimeout(new Promise((resolve, reject) => {
      backend.server.once('error', reject);
      backend.server.listen(0, '127.0.0.1', resolve);
    }), 'local server startup');
    baseUrl = `http://127.0.0.1:${backend.server.address().port}`;
    const { createNetworkPolicy } = require('../lib/network-policy');
    const configuredStorage = backend.supabaseClient;

    await check('configured SDK: private pairing and chat never invoke storage', async () => {
      assert.equal(configuredStorage.isReady(), true);
      assert.equal(sdkInitializations.length, 1);
      const a = await connect({ origin: 'https://streetalk-live.vercel.app', headers: {
        'cf-connecting-ip': '198.51.100.9', 'x-forwarded-for': '203.0.113.10'
      } });
      const b = await connect();
      const outsider = await connect();
      assert.equal(backend.users.get(a.id).ip, '127.0.0.1', 'Untrusted forwarding headers must be ignored');
      const outsiderEvents = [];
      outsider.on('match_found', data => outsiderEvents.push(data));
      outsider.on('receive_message', data => outsiderEvents.push(data));
      for (const mood of ['__proto__', 'constructor', 'toString', 'sconosciuto']) {
        const invalid = event(a, 'error_event');
        a.emit('join_queue', { gender: 'M', targetGender: 'Tutti', mood, secret: 'Contenuto sintetico' });
        assert.equal((await invalid).code, 'INVALID_PAYLOAD');
      }
      const secretA = 'Sintetico arancio alfa';
      const secretB = 'Sintetico arancio beta';
      const matchEvents = [event(a, 'match_found'), event(b, 'match_found')];
      a.emit('join_queue', { gender: 'M', targetGender: 'Tutti', mood: ' CAZZEGGIO ', secret: secretA });
      b.emit('join_queue', { gender: 'F', targetGender: 'Tutti', mood: 'cazzeggio', secret: secretB });
      const [matchA, matchB] = await Promise.all(matchEvents);
      assert.equal(matchA.partnerSecret, secretB);
      assert.equal(matchB.partnerSecret, secretA);
      assert.equal(matchA.roomId, matchB.roomId);
      assert.equal(matchA.partnerMood, 'cazzeggio');
      const markup = '<b>messaggio sintetico & amici</b>';
      const deliveries = [event(a, 'receive_message'), event(b, 'receive_message')];
      a.emit('send_message', { roomId: matchA.roomId, message: markup });
      for (const message of await Promise.all(deliveries)) assert.equal(message.message, markup);
      const unauthorized = event(outsider, 'error_event');
      outsider.emit('send_message', { roomId: matchA.roomId, message: 'Intrusione sintetica' });
      assert.equal((await unauthorized).code, 'UNAUTHORIZED');
      assert.deepEqual(outsiderEvents, []);
      assert.deepEqual(storageCalls, [], 'Neither SDK reads nor writes belong to private pairing/message delivery');
      backend.testPair = { a, b, roomId: matchA.roomId, secretA };
    });

    await check('direct feed API and compatibility helpers stay closed with configured storage', async () => {
      for (const path of ['/api/secrets', '/api/secrets?mood=cazzeggio&limit=100']) {
        const response = await request(path, 'https://streetalk-live.vercel.app');
        assert.equal(response.status, 410);
        assert.equal(response.headers['cache-control'], 'no-store');
        assert.deepEqual(response.body, { ok: false, code: 'FEED_DISABLED', secrets: [] });
      }
      assert.deepEqual(await configuredStorage.archiveSecret({ content: 'Privato sintetico', isPublic: true }),
        { ok: false, code: 'PRIVATE_CONTENT_NOT_STORED' });
      assert.deepEqual(await configuredStorage.getPublicSecrets(), { ok: false, code: 'FEED_DISABLED', secrets: [] });
      assert.deepEqual(storageCalls, []);
      const stats = await request('/api/stats');
      assert.equal(stats.body.supabase.privateContentStorage, false);
      assert.equal(stats.body.supabase.publicFeedEnabled, false);
      assert(!JSON.stringify(stats.body).includes(backend.testPair.secretA));
    });

    await check('HTTP, polling and WebSocket enforce deliberate origins, including null rejection', async () => {
      for (const transport of ['polling', 'websocket']) {
        for (const origin of ['https://streetalk-live.vercel.app', 'https://streetalk.onrender.com', undefined]) {
          (await connect({ transport, origin })).disconnect();
        }
        for (const origin of ['https://untrusted.invalid', 'null', 'https://streetalk-live.vercel.app.untrusted.invalid', 'http://localhost:3000']) {
          await connect({ transport, origin, rejectOrigin: true });
        }
      }
      assert.equal((await request('/api/stats', 'https://untrusted.invalid')).status, 403);
      assert.equal((await request('/api/stats', 'null')).status, 403);
      const allowed = await request('/health', 'https://streetalk-live.vercel.app');
      assert.equal(allowed.status, 200);
      assert.equal(allowed.headers['access-control-allow-origin'], 'https://streetalk-live.vercel.app');
      const dev = createNetworkPolicy({ nodeEnv: 'development', allowedOrigins: '', trustedProxies: '' });
      for (const origin of ['http://localhost:3000', 'http://127.0.0.1:5173', 'http://[::1]:4000']) {
        assert(dev.isOriginAllowed(origin));
      }
      for (const origin of ['null', 'http://localhost.untrusted.invalid', 'http://localhost:3000/path', 'http://127.0.0.2:3000', 'file://']) {
        assert.equal(dev.isOriginAllowed(origin), false);
      }
      assert.throws(() => createNetworkPolicy({ allowedOrigins: '*', trustedProxies: '' }), /exact HTTP/);
    });

    await check('only explicit trusted proxy chains affect client IP; CF and forged prefixes are ignored', () => {
      const direct = createNetworkPolicy({ trustedProxies: '' });
      const trusted = createNetworkPolicy({ trustedProxies: '127.0.0.1/32,::1/128,10.10.0.0/24' });
      const socket = (peer, forwarded) => ({ request: {
        socket: { remoteAddress: peer }, headers: { 'x-forwarded-for': forwarded, 'cf-connecting-ip': '198.51.100.99' }
      } });
      assert.equal(direct.getClientIp(socket('127.0.0.1', '203.0.113.9')), '127.0.0.1');
      assert.equal(trusted.getClientIp(socket('127.0.0.1', '203.0.113.9')), '203.0.113.9');
      assert.equal(trusted.getClientIp(socket('127.0.0.1', '198.51.100.1, 203.0.113.9, 10.10.0.2')), '203.0.113.9');
      assert.equal(trusted.getClientIp(socket('203.0.113.8', '198.51.100.1')), '203.0.113.8');
      assert.equal(trusted.getClientIp(socket('::1', '2001:db8::3')), '2001:db8::3');
      assert.equal(trusted.getClientIp(socket('127.0.0.1', 'not-an-ip')), '127.0.0.1');
      assert.equal(trusted.getClientIp(socket('127.0.0.1', undefined)), '127.0.0.1');
      for (const entry of ['true', '1', '*', '0.0.0.0/0', '::/0', '127.0.0.1/33']) {
        assert.throws(() => createNetworkPolicy({ trustedProxies: entry }), /explicit IP/);
      }
    });

    await check('report persistence contains only reason codes and keyed IP pseudonyms', async () => {
      const { a, b, roomId, secretA } = backend.testPair;
      const reportEvents = [event(a, 'report_confirmed'), event(b, 'partner_skipped')];
      a.emit('report_user', { roomId, reason: secretA });
      const [ack] = await Promise.all(reportEvents);
      assert.equal(ack.success, true);
      const inserts = storageCalls.filter(call => call.method === 'insert');
      assert.equal(inserts.length, 1);
      assert.equal(inserts[0].table, 'reports');
      const row = inserts[0].values[0];
      assert.equal(row.reason, 'safety_report');
      assert.match(row.reporter_ip_hash, /^[a-f0-9]{64}$/);
      assert.match(row.reported_ip_hash, /^[a-f0-9]{64}$/);
      assert(!JSON.stringify(storageCalls).includes(secretA));
      assert(!JSON.stringify(storageCalls).includes('127.0.0.1'));
      for (const reason of ['safety_report', 'spam', 'harassment', 'other']) {
        assert.equal(configuredStorage.normalizeReportReason(reason), reason);
      }
    });

    await check('SDK errors cannot leak request data through logs or result objects', async () => {
      const warnings = [];
      const originalWarn = console.warn;
      failStorage = true;
      console.warn = (...args) => warnings.push(args.join(' '));
      try {
        const report = await configuredStorage.logReport({ roomId: 'street_synthetic', reason: 'spam', reporterIp: '192.0.2.1', reportedIp: '192.0.2.2' });
        assert.deepEqual(report, { ok: false, code: 'REPORT_WRITE_FAILED' });
        const telemetry = await configuredStorage.recordTelemetry({ totalMatches: 1 });
        assert.deepEqual(telemetry, { ok: false, code: 'TELEMETRY_WRITE_FAILED' });
        assert.equal(warnings.length, 2);
        assert(!warnings.join(' ').includes('SDK_PRIVATE_TEXT'));
      } finally {
        failStorage = false;
        console.warn = originalWarn;
      }
    });

    await check('anon-only credentials and missing IP_SALT disable cloud moderation', async () => {
      const modulePath = require.resolve('../lib/supabase');
      for (const changes of [
        { SUPABASE_SERVICE_ROLE_KEY: '', SUPABASE_ANON_KEY: 'synthetic-public-key' },
        { IP_SALT: '' }, { IP_SALT: '   ' }
      ]) {
        Object.assign(process.env, syntheticConfig, changes);
        delete require.cache[modulePath];
        const before = sdkInitializations.length;
        const disabled = require('../lib/supabase');
        assert.equal(disabled.isReady(), false);
        assert.equal(sdkInitializations.length, before);
        const beforeCalls = storageCalls.length;
        assert.deepEqual(await disabled.logReport({ roomId: 'street_synthetic' }), { ok: true, memoryOnly: true });
        assert.equal(storageCalls.length, beforeCalls);
        if (!process.env.IP_SALT.trim()) assert.throws(() => disabled.hashIp('192.0.2.1'), /IP_SALT/);
      }
      Object.assign(process.env, syntheticConfig);
    });

    console.log(`M0 backend: ${passed} behavioral groups passed; local synthetic data and fake SDK only.`);
  } finally {
    for (const socket of clients) { socket.removeAllListeners(); socket.disconnect(); socket.close(); }
    for (const req of requests) req.destroy();
    for (const timer of timers) clearTimeout(timer);
    if (backend) {
      for (const room of backend.rooms.values()) clearInterval(room.timerInterval);
      clearInterval(backend.statsBroadcastTimer);
      clearInterval(backend.ipJailSweeper);
      await new Promise(resolve => backend.io.close(resolve));
    }
    Module._load = originalLoad;
    for (const [name, value] of savedEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
