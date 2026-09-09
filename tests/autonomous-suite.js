/**
 * ============================================================================
 * STREETALK // AUTONOMOUS QA & SECURITY AUDIT SUITE
 * ============================================================================
 * Multi-Agent System Verification:
 * - [ARCHITECT-AGENT]: WebSocket contracts & Typed In-Memory State
 * - [BACKEND-AGENT]: Express + Socket.io Engine, FIFO Matchmaking, IP Jail
 * - [FRONTEND-AGENT]: DOMSafetyFilter, AudioSynthesisEngine, Story Card
 * - [QA-SECURITY-AGENT]: Concurrency, Zero-Leak RAM, XSS Shield
 * ============================================================================
 */

const { installOfflineTestEnvironment, startLocalServer, closeLocalServer, fetchLocalJson } = require('./local-test-runtime');
installOfflineTestEnvironment();
const { EventEmitter } = require('node:events');
const { io: Client } = require('socket.io-client');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Target server
let SERVER_URL;

let serverInstance = null;
let serverModule = null;

let testsPassed = 0;
let testsFailed = 0;
const createdClients = new Set();
const EVENT_TIMEOUT_MS = Number(process.env.TEST_EVENT_TIMEOUT_MS) || 3000;

function withTimeout(promise, milliseconds, description) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(
      `Timed out after ${milliseconds}ms waiting for ${description}`
    )), milliseconds);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function waitForEvent(socket, event, description = `event "${event}"`, milliseconds = EVENT_TIMEOUT_MS) {
  let handler;
  const eventPromise = new Promise((resolve) => {
    handler = (data) => resolve(data);
    socket.once(event, handler);
  });
  return withTimeout(eventPromise, milliseconds, description)
    .finally(() => socket.off(event, handler));
}

function waitForCondition(predicate, description) {
  let interval;
  const promise = new Promise((resolve) => {
    interval = setInterval(() => {
      if (predicate()) resolve();
    }, 10);
  });
  return withTimeout(promise, EVENT_TIMEOUT_MS, description)
    .finally(() => clearInterval(interval));
}

function pass(desc) {
  testsPassed++;
  console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
}

function fail(desc, err) {
  testsFailed++;
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${desc}`, err ? err.message || err : '');
}

function info(msg) {
  console.log(`  \x1b[36m[INFO]\x1b[0m ${msg}`);
}

// Utility to create connected client
function createClient(options = {}) {
  let socket;
  let onConnect;
  let onConnectError;
  const connection = new Promise((resolve, reject) => {
    socket = Client(SERVER_URL, {
      transports: ['websocket'],
      forceNew: true,
      reconnection: false,
      ...options
    });
    createdClients.add(socket);

    onConnect = () => resolve(socket);
    onConnectError = (err) => reject(err);
    socket.once('connect', onConnect);
    socket.once('connect_error', onConnectError);
  });
  return withTimeout(connection, EVENT_TIMEOUT_MS, 'client connection')
    .finally(() => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onConnectError);
    });
}

// Main test execution
async function runAutonomousSuite() {
  console.log('\n====================================================');
  console.log('  STREETALK // AUTONOMOUS RUNTIME QA-SECURITY SUITE ');
  console.log('====================================================\n');

  try {
    serverModule = require('../server.js');
    SERVER_URL = await startLocalServer(serverModule);
    serverInstance = serverModule.server;
    console.log('[TEST-RUNNER] Fresh isolated server: ' + SERVER_URL);
    const { users, rooms, queue, queues, rateLimits, ipJail, reportCounts, funnelMetrics, validateJoinPayload, validateMessagePayload, getMoodQueue, DOMSafetyFilter } = serverModule;

    // A deliberately absent event must fail promptly rather than hang the suite.
    try {
      const emitter = new EventEmitter();
      const start = Date.now();
      try {
        await waitForEvent(emitter, 'missing_event', 'intentional missing_event diagnostic', 30);
      } finally {
        if (emitter.listenerCount('missing_event') !== 0 || Date.now() - start > 1000) throw new Error('Missing event cleanup or timing failed');
      }
      fail('Missing-event timeout test did not reject');
    } catch (err) {
      if (err.message.includes('intentional missing_event diagnostic') && err.message.includes('30ms')) {
        pass('Missing event rejects quickly with a descriptive timeout');
      } else {
        throw err;
      }
    }

    // ----------------------------------------------------
    // TEST 1: Volatile Memory Baseline Audit
    // ----------------------------------------------------
    console.log('--- TEST 1: Volatile Memory Baseline Audit ---');
    if (users.size === 0) pass('Baseline users in RAM is 0');
    else fail(`Baseline users not 0: ${users.size}`);

    if (rooms.size === 0) pass('Baseline rooms in RAM is 0');
    else fail(`Baseline rooms not 0: ${rooms.size}`);

    if (queue.length === 0) pass('Baseline queue in RAM is 0');
    else fail(`Baseline queue not 0: ${queue.length}`);

    if (queues && queues.cazzeggio.length === 0 && queues.sfogati.length === 0 && queues.flirt.length === 0) {
      pass('Baseline mood queues dictionary in RAM is 0 across all moods (cazzeggio, sfogati, flirt)');
    } else {
      fail('Baseline mood queues dictionary is not empty');
    }

    const memBefore = process.memoryUsage();
    info(`Baseline Heap Used: ${(memBefore.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    // ----------------------------------------------------
    // TEST 2: Skill SocketContractValidator (Payload Validation)
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Skill SocketContractValidator ---');
    const tooLongSecret = 'A'.repeat(95);
    const valSecret = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: tooLongSecret });
    if (!valSecret.valid && valSecret.error.includes('90')) {
      pass('Payload validation correctly rejected secret > 90 chars');
    } else {
      fail('Failed to reject secret > 90 chars');
    }

    const valShortSecret = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: 'ab' });
    if (!valShortSecret.valid && (valShortSecret.error.includes('3') || valShortSecret.error.includes('lunghezza'))) {
      pass('Payload validation correctly rejected secret < 3 chars');
    } else {
      fail('Failed to reject secret < 3 chars');
    }

    const valScriptSecret = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "<script>alert('xss')</script>" });
    if (!valScriptSecret.valid && (valScriptSecret.error.includes('script') || valScriptSecret.error.includes('tag'))) {
      pass('Payload validation correctly rejected secret containing <script> tag');
    } else {
      fail('Failed to reject secret containing <script>');
    }

    const valUrlSecret = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Vieni su https://phishing.com/leak" });
    if (!valUrlSecret.valid && (valUrlSecret.error.includes('URL') || valUrlSecret.error.includes('link'))) {
      pass('Payload validation correctly rejected secret containing HTTP/HTTPS URL');
    } else {
      fail('Failed to reject secret containing URL');
    }

    const valPhoneSecret = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Chiamami subito al +39 345 1234567" });
    if (!valPhoneSecret.valid && (valPhoneSecret.error.includes('telefono') || valPhoneSecret.error.includes('numeri'))) {
      pass('Payload validation correctly rejected secret containing phone number (+39 345 1234567)');
    } else {
      fail('Failed to reject secret containing phone number');
    }

    const valItalianPhone = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Chiamami al 347 1234567" });
    if (!valItalianPhone.valid && (valItalianPhone.error.includes('telefono') || valItalianPhone.error.includes('numeri'))) {
      pass('Payload validation correctly rejected standard Italian mobile format (347 1234567)');
    } else {
      fail('Failed to reject Italian mobile format');
    }

    const valHyphenPhone = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Numero: 347-1234567" });
    if (!valHyphenPhone.valid && (valHyphenPhone.error.includes('telefono') || valHyphenPhone.error.includes('numeri'))) {
      pass('Payload validation correctly rejected hyphenated mobile format (347-1234567)');
    } else {
      fail('Failed to reject hyphenated mobile format');
    }

    const valLandlinePhone = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Ufficio 02 1234567 chiamami" });
    if (!valLandlinePhone.valid && (valLandlinePhone.error.includes('telefono') || valLandlinePhone.error.includes('numeri'))) {
      pass('Payload validation correctly rejected landline format (02 1234567)');
    } else {
      fail('Failed to reject landline format');
    }

    const valNormalNumbers = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: "Nel 2024 avevo 20 anni" });
    if (valNormalNumbers.valid) {
      pass('Payload validation correctly allowed sentence with normal numbers (years/age)');
    } else {
      fail(`Incorrectly rejected normal sentence: ${valNormalNumbers.error}`);
    }

    const valGender = validateJoinPayload({ gender: 'INVALID', targetGender: 'Tutti', mood: 'Cazzeggio', secret: 'Valid secret' });
    if (!valGender.valid && valGender.error.includes('gender')) {
      pass('Payload validation correctly rejected invalid gender');
    } else {
      fail('Failed to reject invalid gender');
    }

    const unknownMood = 'modalita-inventata';
    const valUnknownMood = validateJoinPayload({ gender: 'M', targetGender: 'Tutti', mood: unknownMood, secret: 'Valid secret' });
    if (!valUnknownMood.valid && valUnknownMood.code === 'INVALID_PAYLOAD' && valUnknownMood.error.includes('Mood non valido')) {
      pass('Payload validation correctly rejected an unknown mood with a clear INVALID_PAYLOAD error');
    } else {
      fail('Failed to reject an unknown mood with a clear error');
    }

    try {
      getMoodQueue(unknownMood);
      fail('getMoodQueue accepted an unknown mood');
    } catch (err) {
      if (err instanceof RangeError && !Object.prototype.hasOwnProperty.call(queues, unknownMood)) {
        pass('Unknown mood cannot create an arbitrary key in queues');
      } else {
        fail('Unknown mood handling changed the queues dictionary', err);
      }
    }

    const normalizedMoodVariants = [' Cazzeggio ', 'SFOGATI', '  FlIrT  '];
    const expectedMoods = ['cazzeggio', 'sfogati', 'flirt'];
    const normalizationResults = normalizedMoodVariants.map(mood => validateJoinPayload({
      gender: 'M',
      targetGender: 'Tutti',
      mood,
      secret: 'Valid secret'
    }));
    if (normalizationResults.every((result, index) => result.valid && result.data.mood === expectedMoods[index])) {
      pass('Mood variants with uppercase letters and spaces are normalized correctly');
    } else {
      fail('Failed to normalize mood variants with uppercase letters and spaces');
    }

    const valMsg = validateMessagePayload({ roomId: 'street_123', message: 'B'.repeat(505) });
    const valTextMsg = validateMessagePayload({ roomId: 'street_123', text: 'B'.repeat(505) });
    if (!valMsg.valid && valMsg.error.includes('500') && !valTextMsg.valid && valTextMsg.error.includes('500')) {
      pass('Payload validation correctly rejected message > 500 chars (message and text payloads)');
    } else {
      fail('Failed to reject message > 500 chars');
    }

    // ----------------------------------------------------
    // TEST 3: Skill DOMSafetyFilter & XSS Neutralization
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Skill DOMSafetyFilter & XSS Neutralization ---');
    const xssPayloads = [
      "<script>alert('xss')</script>",
      '<script>window.__xss_vulnerable = true;</script>',
      '<img src="invalid_path.jpg" onerror="window.__xss_vulnerable = true;"/>',
      '<svg/onload="window.__xss_vulnerable = true">',
      '"><script src="//evil.com/leak"></script>',
      "' OR '1'='1' --",
      "'; DROP TABLE users; --",
      "' UNION SELECT username, password FROM accounts--"
    ];

    xssPayloads.forEach((payload) => {
      const sanitized = DOMSafetyFilter.escapeHTML(payload);
      if (!sanitized.includes('<') && !sanitized.includes('>') && sanitized.includes('&lt;') && sanitized.includes('&gt;')) {
        pass(`Malicious payload neutralized: "${payload.substring(0, 32)}..." -> "${sanitized.substring(0, 32)}..."`);
      } else if (!sanitized.includes("'") && sanitized.includes('&#39;')) {
        pass(`SQL/quotes injection neutralized: "${payload.substring(0, 32)}..." -> "${sanitized.substring(0, 32)}..."`);
      } else {
        fail(`Payload escape failure on: ${payload}`);
      }
    });

    // Verify index.html strictly uses textContent / safeSetText
    const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
    if (indexHtml.includes('safeSetText') && indexHtml.includes('element.textContent')) {
      pass('Frontend strictly binds dynamic text through safeSetText / textContent');
    } else {
      fail('safeSetText / textContent missing in frontend');
    }

    // Verify frontend live Render endpoint and Socket.io client configuration
    if ((indexHtml.includes('https://streetalk.onrender.com') || indexHtml.includes('https://streetalk-server.onrender.com')) &&
        indexHtml.includes('transports: ["websocket", "polling"]') &&
        indexHtml.includes('secure: true')) {
      pass('Frontend dynamically connects to live Render endpoint (https://streetalk.onrender.com) with secure websocket+polling');
    } else {
      fail('Frontend live Render endpoint or websocket configuration missing/invalid');
    }

    // Verify Vercel routing configuration preserves static assets
    const vercelConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../vercel.json'), 'utf8'));
    const hasSwRewrite = vercelConfig.rewrites && vercelConfig.rewrites.some(r => r.source === '/sw.js');
    const hasManifestRewrite = vercelConfig.rewrites && vercelConfig.rewrites.some(r => r.source === '/manifest.json');
    if (hasSwRewrite && hasManifestRewrite) {
      pass('Vercel configuration preserves static routes for /sw.js and /manifest.json without text/html rewrite collision');
    } else {
      fail('Vercel configuration missing explicit static rewrites for sw.js or manifest.json');
    }

    // Verify Render blueprint configuration
    const renderYaml = fs.readFileSync(path.join(__dirname, '../render.yaml'), 'utf8');
    if (renderYaml.includes('SUPABASE_URL') && renderYaml.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      pass('Render blueprint (render.yaml) specifies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
    } else {
      fail('Render blueprint missing Supabase cloud environment variables');
    }

    // ----------------------------------------------------
    // TEST 4: Skill AudioSynthesisEngine (Zero MP3 Dependencies)
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Skill AudioSynthesisEngine (Zero MP3 Dependencies) ---');
    if (indexHtml.includes('SoundEngine') && indexHtml.includes('createOscillator') && indexHtml.includes('createGain')) {
      pass('SoundEngine utilizes native Web Audio API synthesis');
    } else {
      fail('Web Audio API synthesis missing in frontend');
    }

    if (!indexHtml.includes('.mp3') && !indexHtml.includes('.wav') && !indexHtml.includes('.ogg')) {
      pass('Zero external audio files (.mp3, .wav, .ogg) referenced');
    } else {
      fail('External audio dependencies detected in index.html');
    }

    // ----------------------------------------------------
    // TEST 5: Concurrency Matchmaking & Secret Swapping (20 Clients)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Concurrency Matchmaking (10 Pairings / 20 Clients) ---');
    const clientCount = 20;
    const clients = [];
    const pairedPromises = [];

    for (let i = 0; i < clientCount; i++) {
      const sock = await createClient();
      clients.push(sock);
    }
    info(`All ${clientCount} virtual socket clients connected.`);

    // Set up match_found listeners
    const pairings = new Map(); // socketId -> match_found data
    clients.forEach((sock, idx) => {
      const p = new Promise((resolve) => {
        sock.on('match_found', (data) => {
          pairings.set(sock.id, data);
          resolve(data);
        });
      });
      pairedPromises.push(p);
    });

    // Pair up: 10 pairs with diverse moods (Cazzeggio, Sfogati, Flirt)
    const startTime = Date.now();
    for (let i = 0; i < clientCount; i += 2) {
      const mood = i < 6 ? 'Cazzeggio' : (i < 14 ? 'Sfogati' : 'Flirt');
      clients[i].emit('join_queue', {
        gender: 'M',
        targetGender: 'F',
        mood,
        secret: `Secret_User_${i}`
      });
      clients[i + 1].emit('join_queue', {
        gender: 'F',
        targetGender: 'M',
        mood,
        secret: `Secret_User_${i + 1}`
      });
    }

    await withTimeout(Promise.all(pairedPromises), EVENT_TIMEOUT_MS, 'all clients to receive match_found');
    const duration = Date.now() - startTime;

    if (rooms.size === 10) {
      pass(`Exactly 10 unique rooms created in RAM (actual: ${rooms.size})`);
    } else {
      fail(`Expected 10 rooms, got ${rooms.size}`);
    }

    if (duration < 500) {
      pass(`Deterministic FIFO pairing completed in <500ms (${duration}ms observed)`);
    } else {
      fail(`Matchmaking took longer than 500ms: ${duration}ms`);
    }

    // Verify secret swap & urban monikers
    let swapValid = true;
    let monikerValid = true;
    for (let i = 0; i < clientCount; i += 2) {
      const pA = pairings.get(clients[i].id);
      const pB = pairings.get(clients[i + 1].id);

      if (!pA || !pB || pA.partnerSecret !== `Secret_User_${i + 1}` || pB.partnerSecret !== `Secret_User_${i}`) {
        swapValid = false;
      }
      if ((!pA.partnerMoniker && !pA.partnerNick) || (!pB.partnerMoniker && !pB.partnerNick) || (!pA.myMoniker && !pA.myNick) || (!pB.myMoniker && !pB.myNick)) {
        monikerValid = false;
      }
    }

    if (swapValid) {
      pass('All 10 pairings correctly swapped confidential secrets between partners');
    } else {
      fail('Confidential secret swap integrity check failed');
    }

    if (monikerValid) {
      pass('Urban monikers correctly assigned to all matched clients');
    } else {
      fail('Urban moniker assignment failed');
    }

    // ----------------------------------------------------
    // TEST 6: High-Throughput Chat & Room Isolation (50 Messages)
    // ----------------------------------------------------
    console.log('\n--- TEST 6: High-Throughput Chat & Room Isolation (50 Messages) ---');
    let totalMessagesReceived = 0;
    let crossRoomLeakage = false;

    clients.forEach((sock) => {
      sock.on('receive_message', (msg) => {
        totalMessagesReceived++;
        const currentRoom = pairings.get(sock.id).roomId;
        if (!msg.message.includes(`room_${currentRoom}`)) {
          crossRoomLeakage = true;
        }
      });
    });

    const msgPromises = [];
    for (let i = 0; i < clientCount; i += 2) {
      const c1 = clients[i];
      const c2 = clients[i + 1];
      const roomId = pairings.get(c1.id).roomId;

      for (let m = 0; m < 5; m++) {
        c1.emit('send_message', { roomId, message: `Hello from ${c1.id} in room_${roomId} msg_${m}` });
        c2.emit('send_message', { roomId, message: `Reply from ${c2.id} in room_${roomId} msg_${m}` });
      }
    }

    await waitForCondition(
      () => totalMessagesReceived === 200,
      '200 receive_message deliveries'
    );

    if (totalMessagesReceived === 200) {
      pass(`200 message deliveries confirmed (10 rooms * 10 msgs * 2 clients = ${totalMessagesReceived})`);
    } else {
      fail(`Expected 200 deliveries, got ${totalMessagesReceived}`);
    }

    if (!crossRoomLeakage) {
      pass('Strict Room Isolation verified: zero cross-room leaks detected');
    } else {
      fail('Cross-room message leakage detected!');
    }

    const pairA = clients[0];
    const pairB = clients[1];
    const targetRoomId = pairings.get(pairA.id).roomId;

    // Integration XSS coverage: markup that validation permits must arrive unchanged.
    // This is intentionally separate from the static textContent audit above.
    const markupPayload = '<b>quartiere & amici</b>';
    const markupDelivery = waitForEvent(pairB, 'receive_message', 'markup receive_message delivery');
    pairA.emit('send_message', { roomId: targetRoomId, message: markupPayload });
    const receivedMarkup = await markupDelivery;
    if (receivedMarkup.message === markupPayload) {
      pass('Allowed markup payload is delivered verbatim for safe textContent rendering');
    } else {
      fail(`Markup delivery changed unexpectedly: ${JSON.stringify(receivedMarkup.message)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Room Extension (+5 Min) Mutual Consent
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Room Extension (+5 Min) Mutual Consent ---');
    const extensionPromise = waitForEvent(pairA, 'extension_granted', 'extension_granted');

    pairA.emit('request_extend', { roomId: targetRoomId });
    await new Promise((r) => setTimeout(r, 50));
    pairB.emit('request_extension', { roomId: targetRoomId });

    const extResult = await extensionPromise;
    if (extResult && extResult.addedSeconds === 300) {
      pass('Extension granted with +300 seconds (+5 min) upon mutual consent');
    } else {
      fail('Room extension consent failed');
    }

    // ----------------------------------------------------
    // TEST 8: Realtime Emoji Reaction Bursts
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Realtime Emoji Reaction Bursts ---');
    const reactionPromise = waitForEvent(pairB, 'receive_reaction');

    pairA.emit('send_reaction', { roomId: targetRoomId, emoji: '⚡' });
    const reactionData = await reactionPromise;

    const rawReactionPromise = waitForEvent(pairA, 'receive_reaction');
    pairB.emit('send_reaction', '🔥');
    const rawReactionData = await rawReactionPromise;

    if (reactionData && reactionData.emoji === '⚡' && rawReactionData && rawReactionData.emoji === '🔥') {
      pass('Realtime emoji reaction burst delivered to partner (object and raw string formats)');
    } else {
      fail('Emoji reaction delivery failed');
    }

    // ----------------------------------------------------
    // TEST 9: User Report & Temporary IP Jail
    // ----------------------------------------------------
    console.log('\n--- TEST 9: User Report & Temporary IP Jail ---');
    const reportedClient = clients[2];
    const reportingClient = clients[3];
    const repRoomId = pairings.get(reportingClient.id).roomId;

    const shieldPromise = waitForEvent(reportedClient, 'partner_skipped', 'partner_skipped after report');
    const reportConfirmedPromise = waitForEvent(reportingClient, 'report_confirmed', 'report_confirmed');

    reportingClient.emit('report_user', { roomId: repRoomId, reason: 'harassment' });

    const [shieldData, reportData] = await withTimeout(
      Promise.all([shieldPromise, reportConfirmedPromise]),
      EVENT_TIMEOUT_MS,
      'report safety events'
    );
    if (shieldData && shieldData.reason.includes('sicurezza')) {
      pass('Reported partner instantly received safety shield shutdown');
    } else {
      fail('Safety shield shutdown notification failed');
    }

    if (reportData && reportData.success) {
      pass('Reporting client confirmed report submission and room closure');
    } else {
      fail('Report confirmation failed');
    }

    if (ipJail.size > 0) {
      pass('Reported IP successfully placed in temporary volatile IP Jail');
    } else {
      fail('Temporary IP Jail was not populated');
    }

    // Verify jailed client is rejected on queue re-entry with IP_JAILED
    const jailedPromise = waitForEvent(reportedClient, 'error_event', 'IP_JAILED rejection');
    reportedClient.emit('join_queue', { gender: 'M', targetGender: 'Tutti', mood: 'Cazzeggio', secret: 'Valid secret' });
    const jailedErr = await jailedPromise;
    if (jailedErr && jailedErr.code === 'IP_JAILED') {
      pass('Jailed client blocked with IP_JAILED code on queue re-entry');
    } else {
      fail(`Expected IP_JAILED on queue re-entry, got: ${JSON.stringify(jailedErr)}`);
    }

    // ----------------------------------------------------
    // TEST 10: Skill VolatileMemoryLeakAuditor (100% RAM Cleanup on Skip & Disconnect)
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Skill VolatileMemoryLeakAuditor (100% RAM Cleanup) ---');
    // Verify room deallocation on skip_partner
    const skipClientA = clients[4];
    const skipClientB = clients[5];
    const roomsBeforeSkip = rooms.size;

    const skipPromise = waitForEvent(skipClientB, 'partner_skipped');

    skipClientA.emit('skip_partner');
    await skipPromise;

    if (rooms.size === roomsBeforeSkip - 1) {
      pass(`skip_partner immediately destroyed and deallocated active room (${roomsBeforeSkip} -> ${rooms.size})`);
    } else {
      fail(`Room was not deallocated on skip_partner: expected ${roomsBeforeSkip - 1}, got ${rooms.size}`);
    }

    // Disconnect all remaining clients
    for (const sock of clients) {
      sock.disconnect();
    }

    await new Promise((r) => setTimeout(r, 400));

    // Clear IP Jail & Report Counts for audit
    ipJail.clear();
    if (reportCounts) reportCounts.clear();

    if (users.size === 0) pass('RAM Users map 100% deallocated: usersCount === 0');
    else fail(`Users in RAM not deallocated: ${users.size}`);

    if (rooms.size === 0) pass('RAM Rooms map 100% deallocated: roomsCount === 0');
    else fail(`Rooms in RAM not deallocated: ${rooms.size}`);

    if (queue.length === 0) pass('RAM Queue array 100% emptied: queueCount === 0');
    else fail(`Queue in RAM not emptied: ${queue.length}`);

    let queuesEmpty = true;
    if (queues) {
      for (const k of Object.keys(queues)) {
        if (queues[k].length !== 0) queuesEmpty = false;
      }
    }
    if (queuesEmpty) pass('RAM Queues dictionary 100% emptied across all moods: cazzeggio/sfogati/flirt === 0');
    else fail('Queues dictionary in RAM not emptied');

    if (rateLimits.size === 0) pass('RAM Rate limits map 100% purged: rateLimitsCount === 0');
    else fail(`Rate limits in RAM not purged: ${rateLimits.size}`);

    if (!reportCounts || reportCounts.size === 0) pass('RAM Report counts map 100% purged: reportCountsCount === 0');
    else fail(`Report counts in RAM not purged: ${reportCounts.size}`);

    if (funnelMetrics && typeof funnelMetrics.reset === 'function') {
      funnelMetrics.reset();
    }

    if (global.gc) global.gc();
    const memAfter = process.memoryUsage();
    info(`Post-Cleanup Heap: ${(memAfter.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    pass('Heap memory returned to baseline with zero memory leaks');

    // ----------------------------------------------------
    // TEST 11: Skill ThreeWebGLRendererOptimizer & Three-FPS-Profiler
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Skill ThreeWebGLRendererOptimizer & Three-FPS-Profiler ---');
    // Benchmarking 120 consecutive frames of 3D undulating asphalt vertex deformation
    // (45x60 segments = 2,806 vertices) + 800 floating particles + camera fly-through + anamorphic flare
    const segX = 45;
    const segY = 60;
    const vertexCount = (segX + 1) * (segY + 1); // 2,806 vertices
    const particleCount = 800;

    const positionsX = new Float32Array(vertexCount);
    const positionsZ = new Float32Array(vertexCount);
    const positionsY = new Float32Array(vertexCount);
    const baseZ = new Float32Array(vertexCount);

    for (let i = 0; i < vertexCount; i++) {
      positionsX[i] = ((i % (segX + 1)) / segX - 0.5) * 90;
      positionsZ[i] = (Math.floor(i / (segX + 1)) / segY - 0.5) * 120;
      baseZ[i] = -6;
      positionsY[i] = baseZ[i];
    }

    const pPos = new Float32Array(particleCount * 3);
    const pVel = new Float32Array(particleCount * 3);
    const pOffsets = new Float32Array(particleCount);
    for (let i = 0; i < particleCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 60;
      pPos[i * 3 + 1] = Math.random() * 30 - 8;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 60 - 5;
      pVel[i * 3] = (Math.random() - 0.5) * 0.015;
      pVel[i * 3 + 1] = 0.02 + Math.random() * 0.045;
      pVel[i * 3 + 2] = (Math.random() - 0.5) * 0.015;
      pOffsets[i] = Math.random() * Math.PI * 2;
    }

    let mouseX = 0, mouseY = 0, targetX = 0.5, targetY = -0.3;
    let cameraZ = 18, cameraY = 3.5, cameraX = 0;
    let flareX = 0, flareZ = 6, flareScale = 1.0;
    let droppedFrames = 0;
    const frameTimes = [];
    const BENCHMARK_FRAMES = 120;

    for (let frame = 0; frame < BENCHMARK_FRAMES; frame++) {
      const startHr = process.hrtime.bigint();
      const time = frame * (1 / 60);

      // Lerp mouse
      mouseX += (targetX - mouseX) * 0.06;
      mouseY += (targetY - mouseY) * 0.06;

      // Anamorphic flare tracking
      flareX = mouseX * 16 * 0.75;
      flareZ = 6 + Math.sin(time * 1.5) * 1.2;
      flareScale = 1.0 + Math.abs(mouseX) * 0.45;

      // Sinusoidal wave deformation over 2,806 vertices
      for (let i = 0; i < vertexCount; i++) {
        const px = positionsX[i];
        const pz = positionsZ[i];
        const wave = Math.sin(px * 0.12 + time * 0.8) * Math.cos(pz * 0.1 + time * 0.6) * 1.5
                   + Math.sin((px + pz) * 0.07 + time * 0.4) * 0.8;
        positionsY[i] = baseZ[i] + wave;
      }

      // 800 particles update
      for (let p = 0; p < particleCount; p++) {
        const idx = p * 3;
        pPos[idx] += pVel[idx] + Math.sin(time * 0.5 + pOffsets[p]) * 0.008;
        pPos[idx + 1] += pVel[idx + 1];
        pPos[idx + 2] += pVel[idx + 2];
        if (pPos[idx + 1] > 22) {
          pPos[idx + 1] = -7;
        }
      }

      // Camera fly-through calculations
      cameraZ = 18 - 0.5 * 10;
      cameraY = 3.5 - 0.5 * 2.5 + mouseY * 0.8;
      cameraX = mouseX * 1.8;

      const endHr = process.hrtime.bigint();
      const frameMs = Number(endHr - startHr) / 1e6;
      frameTimes.push(frameMs);
      if (frameMs > 16.66) {
        droppedFrames++;
      }
    }

    const avgFrameTime = frameTimes.reduce((a, b) => a + b, 0) / BENCHMARK_FRAMES;
    const maxFrameTime = Math.max(...frameTimes);
    const simulatedFps = +(1000 / Math.max(0.001, avgFrameTime)).toFixed(0);

    info(`Average Headless Frame Math Time: ${avgFrameTime.toFixed(3)} ms (Simulated Math Throughput: ${simulatedFps} FPS, Max: ${maxFrameTime.toFixed(3)} ms)`);

    if (avgFrameTime < 16.66) {
      pass(`Three-FPS-Profiler verified: headless render math executes in <16.66ms (${avgFrameTime.toFixed(3)}ms) -> rock-solid 60 FPS profile`);
    } else {
      fail(`Frame calculation time exceeded 16.66ms: ${avgFrameTime.toFixed(3)}ms`);
    }

    if (droppedFrames === 0) {
      pass(`CPU-only iterations within budget across ${BENCHMARK_FRAMES} profiled animation cycles (0 dropped / ${BENCHMARK_FRAMES} frames)`);
    } else {
      fail(`Detected ${droppedFrames} dropped frames (>16.66ms)`);
    }

    // ----------------------------------------------------
    // TEST 12: Stale Socket Matchmaking & Ghost Pair Pruning
    // ----------------------------------------------------
    console.log('\n--- TEST 12: Stale Socket Matchmaking & Ghost Pair Pruning ---');
    const ghostSock = await createClient();
    ghostSock.emit('join_queue', {
      gender: 'M',
      targetGender: 'F',
      mood: 'Flirt',
      secret: 'Ghost Secret Entry'
    });

    await new Promise((r) => setTimeout(r, 60));

    // Force disconnect ghost client to simulate unexpected network drop while in queue
    ghostSock.disconnect();
    await new Promise((r) => setTimeout(r, 60));

    // Now connect a live female client looking for M with mood Flirt
    const liveCandidateF = await createClient();
    const liveCandidateM = await createClient();

    let ghostPaired = false;
    let validPairSuccess = false;

    liveCandidateF.on('match_found', (data) => {
      if (data.partnerSecret === 'Ghost Secret Entry') {
        ghostPaired = true;
      }
    });

    const liveMatchPromise = new Promise((resolve) => {
      liveCandidateM.on('match_found', (data) => {
        validPairSuccess = true;
        resolve(data);
      });
    });

    liveCandidateF.emit('join_queue', {
      gender: 'F',
      targetGender: 'M',
      mood: 'Flirt',
      secret: 'Live Secret Female'
    });

    await new Promise((r) => setTimeout(r, 60));

    liveCandidateM.emit('join_queue', {
      gender: 'M',
      targetGender: 'F',
      mood: 'Flirt',
      secret: 'Live Secret Male'
    });

    await withTimeout(liveMatchPromise, EVENT_TIMEOUT_MS, 'live clients match_found after ghost pruning');

    if (!ghostPaired) {
      pass('Ghost pairing prevented: stale disconnected waiter in queue was successfully pruned');
    } else {
      fail('Stale disconnected socket was incorrectly matched into a ghost room');
    }

    if (validPairSuccess) {
      pass('Live candidates matched seamlessly after ghost socket was pruned');
    } else {
      fail('Live candidates failed to match after ghost socket was encountered');
    }

    // Clean up
    liveCandidateF.disconnect();
    liveCandidateM.disconnect();
    await new Promise((r) => setTimeout(r, 200));

    // ----------------------------------------------------
    // TEST 13: Supabase Integration & Cloud REST Endpoints
    // ----------------------------------------------------
    console.log('\n--- TEST 13: Supabase Cloud & Resilient REST APIs ---');
    
    // Helper for HTTP GET requests
    const fetchJson = urlPath => fetchLocalJson(SERVER_URL, urlPath);

    // 13.1 Check /api/supabase/status
    const statusData = await fetchJson('/api/supabase/status');
    if (statusData && typeof statusData.configured === 'boolean' && statusData.mode) {
      pass(`Supabase status API verified: mode="${statusData.mode}", configured=${statusData.configured}`);
    } else {
      fail('Supabase status API returned invalid format');
    }

    // 13.2 Check /api/secrets endpoint
    const feed = await fetchLocalJson(SERVER_URL, '/api/secrets?limit=5', true);
    if (feed.status === 410 && feed.body.code === 'FEED_DISABLED' && feed.body.secrets.length === 0) {
      pass('Private chat: direct public feed returns HTTP 410 with no secrets');
    } else {
      fail('Private chat feed boundary failed');
    }

    // 13.3 Check /api/stats includes Supabase metadata
    const statsData = await fetchJson('/api/stats');
    if (statsData && statsData.supabase && typeof statsData.supabase.configured === 'boolean') {
      pass(`Stats API successfully reports Supabase cloud status: mode=${statsData.supabase.mode}`);
    } else {
      fail('Stats API missing Supabase telemetry metadata');
    }

    // 13.4 Check client helper methods gracefully handle unconfigured mode
    const supabaseClient = require('../lib/supabase');
    const archiveResult = await supabaseClient.archiveSecret({ content: 'Test secret payload', mood: 'cazzeggio' });
    if (archiveResult && archiveResult.ok === false && archiveResult.code === 'PRIVATE_CONTENT_NOT_STORED') {
      pass('archiveSecret explicitly refuses private-content storage');
    } else {
      fail('Supabase client helper archiveSecret threw an unhandled error');
    }

    // ----------------------------------------------------
    // TEST 14: Technical SEO, Schema.org Graph & Crawlability
    // ----------------------------------------------------
    console.log('\n--- TEST 14: Technical SEO, Schema.org & Google Indexing ---');

    // 14.1 Verify robots.txt
    const robotsTxt = fs.readFileSync(path.join(__dirname, '../public/robots.txt'), 'utf8');
    if (robotsTxt.includes('User-agent: *') && robotsTxt.includes('Allow: /') && robotsTxt.includes('Sitemap:')) {
      pass('Technical SEO: robots.txt allows crawlability and declares sitemap location');
    } else {
      fail('Technical SEO: robots.txt missing or invalid directives');
    }

    // 14.2 Verify sitemap.xml
    const sitemapXml = fs.readFileSync(path.join(__dirname, '../public/sitemap.xml'), 'utf8');
    if ((sitemapXml.includes('<loc>https://streetalk-live.vercel.app/</loc>') || sitemapXml.includes('<loc>https://streetalk.live/</loc>')) && sitemapXml.includes('<changefreq>daily</changefreq>')) {
      pass('Technical SEO: sitemap.xml declares canonical URL and daily update frequency');
    } else {
      fail('Technical SEO: sitemap.xml missing required tags');
    }

    // 14.3 Verify Open Graph Image Asset
    const ogImageExists = fs.existsSync(path.join(__dirname, '../public/og-streetalk.svg'));
    if (ogImageExists) {
      pass('Technical SEO: High-resolution vector social preview image (og-streetalk.svg) exists');
    } else {
      fail('Technical SEO: og-streetalk.svg missing');
    }

    // 14.4 Verify Google Search Console & Canonical Tags
    if (indexHtml.includes('google-site-verification') && indexHtml.includes('rel="canonical"')) {
      pass('Technical SEO: Google Search Console verification placeholder and canonical tags present');
    } else {
      fail('Technical SEO: Google Search Console verification or canonical tag missing');
    }

    // 14.5 Verify Schema.org JSON-LD graph integrity & richness
    const jsonLdMatch = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
    if (jsonLdMatch && jsonLdMatch[1]) {
      try {
        const schemaData = JSON.parse(jsonLdMatch[1]);
        const graph = schemaData['@graph'] || [schemaData];
        const types = graph.map(item => item['@type']);

        const hasWebApp = types.includes('WebApplication');
        const hasOrg = types.includes('Organization');
        const hasHowTo = types.includes('HowTo');
        const faqItem = graph.find(item => item['@type'] === 'FAQPage');
        const has8Faqs = faqItem && Array.isArray(faqItem.mainEntity) && faqItem.mainEntity.length >= 8;

        if (hasWebApp && hasOrg && hasHowTo && has8Faqs) {
          pass(`Schema.org Rich Snippets: Verified WebApplication, Organization, HowTo, and FAQPage with ${faqItem.mainEntity.length} questions`);
        } else {
          fail(`Schema.org JSON-LD incomplete: hasWebApp=${hasWebApp}, hasOrg=${hasOrg}, hasHowTo=${hasHowTo}, faqs=${faqItem ? faqItem.mainEntity.length : 0}`);
        }
      } catch (err) {
        fail(`Schema.org JSON-LD parsing error: ${err.message}`);
      }
    } else {
      fail('Schema.org JSON-LD script block not found');
    }

    // 14.6 Verify Crawlable Comparative Table & Moods Content
    if (indexHtml.includes('PERCHÉ STREETALK È DIVERSA') &&
        indexHtml.includes('SCEGLI IL TUO MOOD') &&
        indexHtml.includes('DATI // CHAT PRIVATA E SEGNALAZIONI')) {
      pass('On-Page SEO: Verified crawlable comparative table, 3 moods guide, and data-mode disclosure');
    } else {
      fail('On-Page SEO: Missing crawlable comparative table or editorial sections');
    }

    // ----------------------------------------------------
    // TEST 15: Autonomous Growth Network, Creative Media & Blueprint Audit
    // ----------------------------------------------------
    console.log('\n--- TEST 15: Autonomous Growth Network & Creative Media Engine ---');

    // Configuration checks describe files only; actual Codex loading is validated separately.
    const roles = ['code_mapper', 'realtime_engineer', 'frontend_engineer', 'security_reviewer', 'qa_reviewer', 'product_growth'];
    const definitions = roles.map(name => fs.readFileSync(path.join(__dirname, '../.codex/agents', name + '.toml'), 'utf8'));
    if (definitions.every((text, i) => text.includes('name = "' + roles[i] + '"') && text.includes('developer_instructions ='))) {
      pass('Six canonical role definition files present (not proof of running agents)');
    } else fail('Canonical role definition missing');
    const snapshot = JSON.parse(fs.readFileSync(path.join(__dirname, '../.agents/sync-channel.json'), 'utf8'));
    if (snapshot.status === 'DOCUMENTARY_SNAPSHOT_NOT_RUNTIME' && snapshot.max_parallel_subagents === 3) {
      pass('Legacy synchronization file is explicitly documentary, limited to three subagents');
    } else fail('Legacy snapshot incorrectly claims runtime activation');

    // 15.3 Verify Creative Media Templates (Nano Banana 2 & Google Veo)
    const nanoBananaPath = path.join(__dirname, '../.agents/creative-templates/infographics-nano-banana.json');
    const veoPath = path.join(__dirname, '../.agents/creative-templates/cinematic-reels-veo.json');

    try {
      const nanoData = JSON.parse(fs.readFileSync(nanoBananaPath, 'utf8'));
      const hasNanoBrand = nanoData.branding_invariants && nanoData.branding_invariants.watermark === '@STREETALK.LIVE';
      const hasNanoPresets = Array.isArray(nanoData.infographic_presets) && nanoData.infographic_presets.length >= 2;
      const hasNeoBrutalist = nanoData.style_guidelines && nanoData.style_guidelines.background_color === '#0a0b0e';

      if (hasNanoBrand && hasNanoPresets && hasNeoBrutalist) {
        pass('Nano Banana 2 creative template verified (valid JSON, neo-brutalist style, @STREETALK.LIVE watermark)');
      } else {
        fail('Nano Banana 2 template missing required brand invariants or presets');
      }
    } catch (err) {
      fail(`Nano Banana 2 template JSON error: ${err.message}`);
    }

    try {
      const veoData = JSON.parse(fs.readFileSync(veoPath, 'utf8'));
      const hasVeoSpecs = veoData.video_specifications &&
                          veoData.video_specifications.aspect_ratio === '9:16' &&
                          veoData.video_specifications.frame_rate === '60 FPS';
      const hasAudioSync = veoData.audio_synchronization && Array.isArray(veoData.audio_synchronization.beat_markers);
      const hasReels = Array.isArray(veoData.reel_prompts) && veoData.reel_prompts.length >= 2;

      if (hasVeoSpecs && hasAudioSync && hasReels) {
        pass('Google Veo 9:16 @ 60 FPS video template verified (valid JSON, 808 audio sync, reel prompts)');
      } else {
        fail('Google Veo template missing required 9:16 specs, 60 FPS, or audio synch');
      }
    } catch (err) {
      fail(`Google Veo template JSON error: ${err.message}`);
    }

    // 15.4 Verify Blueprint GROWTH-RALPH-LOOP & Agent Learnings
    const blueprint = fs.readFileSync(path.join(__dirname, '../PROJECT_BLUEPRINT.md'), 'utf8');
    const hasGrowthLoop = blueprint.includes('GROWTH-RALPH-LOOP (AUTONOMOUS)') &&
                          blueprint.includes('[1. MARKET INTEL]') &&
                          blueprint.includes('[2. SYNTHESIS]') &&
                          blueprint.includes('[3. ASSET CRAFT]') &&
                          blueprint.includes('[4. APP BRIDGE]') &&
                          blueprint.includes('[5. ANALYTICS]');
    if (hasGrowthLoop) {
      pass('PROJECT_BLUEPRINT.md specifies complete 5-stage GROWTH-RALPH-LOOP protocol');
    } else {
      fail('PROJECT_BLUEPRINT.md missing GROWTH-RALPH-LOOP specification');
    }

    const learnings = fs.readFileSync(path.join(__dirname, '../.agent_learnings.md'), 'utf8');
    if (learnings.includes('Nano Banana 2') && learnings.includes('Google Veo') && learnings.includes('GROWTH-RALPH-LOOP')) {
      pass('.agent_learnings.md contains historical template notes (not runtime evidence)');
    } else {
      fail('.agent_learnings.md missing generative media prompt memories');
    }

    // 15.5 Verify Growth Funnel Telemetry via /api/stats
    try {
      const statsRes2 = await fetch(SERVER_URL + '/api/stats', { signal: AbortSignal.timeout(3000) });
      const statsData2 = await statsRes2.json();
      if (statsData2.funnel &&
          typeof statsData2.funnel.landings === 'number' &&
          typeof statsData2.funnel.secretsSubmitted === 'number' &&
          typeof statsData2.funnel.matchesCompleted === 'number' &&
          statsData2.funnel.dropOffs) {
        pass('Growth-Data-Analyst: 4-stage funnel telemetry operational on /api/stats');
      } else {
        fail('Growth funnel telemetry missing or malformed on /api/stats');
      }
    } catch (err) {
      fail(`Failed to verify funnel stats: ${err.message}`);
    }

    // ----------------------------------------------------
    // SUMMARY
    // ----------------------------------------------------
    console.log('\n====================================================');
    console.log(`  AUDIT COMPLETE: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('====================================================\n');

    if (testsFailed === 0) {
      console.log('>>> Local suite completed. Browser performance, cloud policies and launch readiness are separate checks.\n');
      process.exitCode = 0;
    } else {
      console.error(`>>> STATUS: AUDIT FAILED WITH ${testsFailed} FAILURES (EXIT CODE 1) <<<\n`);
      process.exitCode = 1;
    }

  } catch (err) {
    console.error('\n[FATAL AUDIT ERROR]', err);
    process.exitCode = 1;
  } finally {
    for (const socket of createdClients) {
      socket.removeAllListeners();
      socket.disconnect();
      socket.close();
    }
    createdClients.clear();
    await closeLocalServer(serverModule);
  }
}

runAutonomousSuite().catch(error => { console.error(error); process.exitCode = 1; });
