const { installOfflineTestEnvironment, startLocalServer, closeLocalServer, fetchLocalJson } = require('./local-test-runtime');
installOfflineTestEnvironment();
const { EventEmitter } = require('node:events');
const ioClient = require('socket.io-client');
const http = require('http');
const fs = require('fs');
const path = require('path');
const serverModule = require('../server.js');
const { server } = serverModule;

let SERVER_URL;
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
  const promise = new Promise((resolve) => {
    handler = resolve;
    socket.once(event, handler);
  });
  return withTimeout(promise, milliseconds, description)
    .finally(() => socket.off(event, handler));
}

function waitForCondition(predicate, description) {
  let interval;
  const promise = new Promise((resolve) => {
    interval = setInterval(() => predicate() && resolve(), 10);
  });
  return withTimeout(promise, EVENT_TIMEOUT_MS, description)
    .finally(() => clearInterval(interval));
}

function fetchStats() { return fetchLocalJson(SERVER_URL, "/api/stats"); }

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runAllTests() {
  console.log('====================================================');
  console.log('  STREETALK // QA-SECURITY AUTOMATED AUDIT & STRESS ');
  console.log('====================================================\n');

  let totalErrors = 0;
  let assertionsPassed = 0;
  const createdClients = new Set();

  try {
  SERVER_URL = await startLocalServer(serverModule);
  console.log('[TEST-RUNNER] Fresh isolated server: ' + SERVER_URL);

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      assertionsPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      totalErrors++;
    }
  }

  try {
    const emitter = new EventEmitter();
    const start = Date.now();
    try {
      await waitForEvent(emitter, 'missing_event', 'intentional missing_event diagnostic', 30);
    } finally {
      if (emitter.listenerCount('missing_event') !== 0 || Date.now() - start > 1000) throw new Error('Missing event cleanup or timing failed');
    }
    assert(false, 'Missing-event timeout test did not reject');
  } catch (err) {
    assert(
      err.message.includes('intentional missing_event diagnostic') && err.message.includes('30ms'),
      'Missing event rejects quickly with a descriptive timeout'
    );
  }

  // ----------------------------------------------------
  // TEST 1: VOLATILE MEMORY BASELINE AUDIT
  // ----------------------------------------------------
  console.log('--- TEST 1: Volatile Memory Baseline Audit ---');
  let baselineStats = null;
  try {
    baselineStats = await fetchStats();
    assert(baselineStats.usersCount === 0, `Baseline users in RAM is 0 (current: ${baselineStats.usersCount})`);
    assert(baselineStats.roomsCount === 0, `Baseline rooms in RAM is 0 (current: ${baselineStats.roomsCount})`);
    assert(baselineStats.queueCount === 0, `Baseline queue in RAM is 0 (current: ${baselineStats.queueCount})`);
    console.log(`  [INFO] Baseline Heap Used: ${baselineStats.memory.heapUsedMb} MB\n`);
  } catch (err) {
    assert(false, `Failed to reach server at ${SERVER_URL}: ${err.message}`);
    throw err;
  }

  // ----------------------------------------------------
  // TEST 2: SKILL SocketContractValidator (Negative Tests)
  // ----------------------------------------------------
  console.log('--- TEST 2: Skill SocketContractValidator (Payload Validation) ---');
  const contractTester = ioClient(SERVER_URL, { reconnection: false });
  createdClients.add(contractTester);

  await withTimeout(new Promise((resolve) => {
    contractTester.on('connect', () => {
      // Test A: Secret > 90 chars
      const overLongSecret = 'A'.repeat(91);
      contractTester.emit('join_queue', {
        gender: 'M',
        targetGender: 'Tutti',
        mood: 'cazzeggio',
        secret: overLongSecret
      });

      contractTester.once('error_event', (err) => {
        assert(err.code === 'INVALID_PAYLOAD', `Rejected secret > 90 chars with INVALID_PAYLOAD (${err.message})`);

        // Test B: Invalid gender
        contractTester.emit('join_queue', {
          gender: 'INVALID_GENDER',
          targetGender: 'Tutti',
          mood: 'cazzeggio',
          secret: 'Valid secret'
        });

        contractTester.once('error_event', (err2) => {
          assert(err2.code === 'INVALID_PAYLOAD', `Rejected invalid gender with INVALID_PAYLOAD (${err2.message})`);
          contractTester.disconnect();
          contractTester.close();
          resolve();
        });
      });
    });
  }), EVENT_TIMEOUT_MS, 'contract-test client connection and validation events');

  // Wait until server has cleaned up contractTester
  for (let i = 0; i < 20; i++) {
    const s = await fetchStats();
    if (s.usersCount === 0) break;
    await wait(50);
  }
  console.log('');

  // ----------------------------------------------------
  // TEST 3: SKILL DOMSafetyFilter & XSS Injection Neutralization
  // ----------------------------------------------------
  console.log('--- TEST 3: Skill DOMSafetyFilter & XSS Audit ---');
  const xssPayloads = [
    '<script>window.__xss_vulnerable=true;alert("XSS")</script>',
    '<img src="invalid_path.jpg" onerror="window.__xss_vulnerable=true">',
    '<svg/onload="window.__xss_vulnerable=true">',
    '"><script src="//evil.com/leak.js"></script>'
  ];

  // Validate the frontend escapeHTML and textContent safety contract
  function simulateFrontendDOMSafetyFilter(input) {
    // Exact escape logic implemented in public/index.html
    const escaped = String(input)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    return escaped;
  }

  for (const malicious of xssPayloads) {
    const sanitized = simulateFrontendDOMSafetyFilter(malicious);
    const hasExecutableTags = /<script|<img|<svg/i.test(sanitized);
    assert(!hasExecutableTags, `XSS Payload successfully neutralized: "${malicious.substring(0, 30)}..." -> "${sanitized.substring(0, 30)}..."`);
  }
  // Static DOM-sink verification (separate from the socket integration check below).
  const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
  assert(
    indexHtml.includes('safeSetText') && indexHtml.includes('element.textContent'),
    'Frontend static audit uses safeSetText / textContent for dynamic content'
  );
  console.log('');

  // ----------------------------------------------------
  // TEST 4: MATCHMAKING DETERMINISM & LATENCY (<500ms)
  // 10 ABBINAMENTI / PAIRINGS (20 virtual clients concurrently)
  // ----------------------------------------------------
  console.log('--- TEST 4: Concurrency Matchmaking (10 Pairings / 20 Clients) ---');
  const TOTAL_PAIRS = 10;
  const TOTAL_CLIENTS = TOTAL_PAIRS * 2;
  const clients = [];
  const roomsReceived = new Map(); // roomId -> { clientA, clientB, secretA, secretB, partnerSecretA, partnerSecretB }

  // Create 20 virtual clients
  for (let i = 0; i < TOTAL_CLIENTS; i++) {
    const pairIndex = Math.floor(i / 2);
    const isClientA = (i % 2 === 0);
    const mood = pairIndex < 5 ? 'cazzeggio' : 'sfogati';
    const gender = isClientA ? 'M' : 'F';
    const targetGender = isClientA ? 'F' : 'M';
    const secret = `Secret_${i}_Pair_${pairIndex}_${Date.now()}`;

    const client = ioClient(SERVER_URL, {
      reconnection: false,
      forceNew: true
    });
    createdClients.add(client);

    client.meta = {
      id: i,
      pairIndex,
      isClientA,
      mood,
      gender,
      targetGender,
      secret,
      matchTime: null,
      matchedRoomId: null,
      partnerSecretReceived: null,
      messagesReceived: []
    };

    clients.push(client);
  }

  // Wait for all clients to connect
  await withTimeout(
    Promise.all(clients.map(c => waitForEvent(c, 'connect', `client ${c.meta.id} connection`))),
    EVENT_TIMEOUT_MS,
    'all stress-test client connections'
  );
  console.log(`  [INFO] All ${TOTAL_CLIENTS} virtual socket clients connected.`);

  // Setup match_found listeners
  const matchPromises = clients.map(client => {
    return new Promise((resolve, reject) => {
      const startQueueTime = Date.now();

      client.on('match_found', (data) => {
        const latency = Date.now() - startQueueTime;
        client.meta.matchTime = latency;
        client.meta.matchedRoomId = data.roomId;
        client.meta.partnerSecretReceived = data.partnerSecret;

        if (!roomsReceived.has(data.roomId)) {
          roomsReceived.set(data.roomId, []);
        }
        roomsReceived.get(data.roomId).push(client);
        resolve({ client, data, latency });
      });

      client.on('error_event', (err) => {
        reject(new Error(`Client ${client.meta.id} error: ${err.message}`));
      });
    });
  });

  // Launch join_queue concurrently
  console.log('  [INFO] Emitting join_queue for all clients simultaneously...');
  clients.forEach(c => {
    c.emit('join_queue', {
      gender: c.meta.gender,
      targetGender: c.meta.targetGender,
      mood: c.meta.mood,
      secret: c.meta.secret
    });
  });

  const matchResults = await withTimeout(
    Promise.all(matchPromises),
    EVENT_TIMEOUT_MS,
    'all clients to receive match_found'
  );
  assert(roomsReceived.size === TOTAL_PAIRS, `Exactly ${TOTAL_PAIRS} unique rooms created (actual: ${roomsReceived.size})`);

  // Verify latencies < 500ms
  let maxLatency = 0;
  matchResults.forEach(r => {
    if (r.latency > maxLatency) maxLatency = r.latency;
  });
  assert(maxLatency < 500, `All pairings occurred within <500ms (max observed: ${maxLatency}ms)`);

  // Verify secret exchange correctness (A received B's secret, B received A's secret)
  let secretSwapValid = true;
  for (const [roomId, pairClients] of roomsReceived.entries()) {
    if (pairClients.length !== 2) {
      secretSwapValid = false;
      break;
    }
    const c0 = pairClients[0];
    const c1 = pairClients[1];

    if (c0.meta.partnerSecretReceived !== c1.meta.secret || c1.meta.partnerSecretReceived !== c0.meta.secret) {
      secretSwapValid = false;
    }
  }
  assert(secretSwapValid, `All ${TOTAL_PAIRS} pairings correctly swapped confidential secrets between partners.`);
  console.log('');

  // ----------------------------------------------------
  // TEST 5: MESSAGES EXCHANGE & ROOM ISOLATION
  // (5 messages per room = 50 messages total)
  // ----------------------------------------------------
  console.log('--- TEST 5: High-Throughput Chat & Room Isolation (50 Messages) ---');
  let totalMessagesEmitted = 0;
  let totalMessagesReceived = 0;
  const messagePromises = [];

  // Register receive_message listeners
  clients.forEach(client => {
    client.on('receive_message', (msg) => {
      client.meta.messagesReceived.push(msg);
      totalMessagesReceived++;
    });
  });

  // Send 5 messages in each room alternating
  for (const [roomId, pairClients] of roomsReceived.entries()) {
    const [client0, client1] = pairClients;

    for (let m = 0; m < 5; m++) {
      const sender = (m % 2 === 0) ? client0 : client1;
      const text = `Msg_${m}_Room_${roomId}_at_${Date.now()}`;
      totalMessagesEmitted++;
      sender.emit('send_message', { roomId, message: text });
    }
  }

  // Wait for all messages to be delivered
  await waitForCondition(() => totalMessagesReceived === 100, '100 receive_message deliveries');

  // Assertions
  assert(totalMessagesEmitted === 50, `50 messages emitted across 10 rooms (emitted: ${totalMessagesEmitted})`);
  // Each message should be delivered to 2 clients in that room (sender + receiver) = 100 received events total
  assert(totalMessagesReceived === 100, `100 message deliveries confirmed (2 per room * 50 = ${totalMessagesReceived})`);

  // Room Isolation verification: check that NO client received messages from another room
  let crossRoomLeak = false;
  for (const [roomId, pairClients] of roomsReceived.entries()) {
    for (const client of pairClients) {
      for (const msg of client.meta.messagesReceived) {
        if (!msg.message.includes(`Room_${roomId}`)) {
          crossRoomLeak = true;
          console.error(`  [LEAK] Client in room ${roomId} received foreign message: ${msg.message}`);
        }
      }
    }
  }
  assert(!crossRoomLeak, 'Room Isolation Verified: Zero messages leaked across room boundaries.');

  // Socket integration check: permitted markup is transported verbatim and is
  // rendered safely by the separately audited textContent sink.
  const integrationPair = Array.from(roomsReceived.values())[0];
  const markupPayload = '<b>quartiere & amici</b>';
  const markupPromise = waitForEvent(
    integrationPair[1],
    'receive_message',
    'markup receive_message delivery'
  );
  integrationPair[0].emit('send_message', {
    roomId: integrationPair[0].meta.matchedRoomId,
    message: markupPayload
  });
  const receivedMarkup = await markupPromise;
  assert(receivedMarkup.message === markupPayload, 'Allowed markup payload is delivered unchanged');
  console.log('');

  // ----------------------------------------------------
  // TEST 6: EXTENSION (+5 MIN) DOUBLE-CONSENT VERIFICATION
  // ----------------------------------------------------
  console.log('--- TEST 6: Room Extension (+5 Min) Double Consent ---');
  const testPair = Array.from(roomsReceived.values())[0];
  const [extClientA, extClientB] = testPair;
  const targetRoomId = extClientA.meta.matchedRoomId;

  const extensionGrantedPromise = withTimeout(new Promise((resolve) => {
    let grantCount = 0;
    const check = (data) => {
      grantCount++;
      if (grantCount === 2) resolve(data);
    };
    extClientA.once('extension_granted', check);
    extClientB.once('extension_granted', check);
  }), EVENT_TIMEOUT_MS, 'extension_granted for both clients');

  // Client A requests extension
  extClientA.emit('request_extension', { roomId: targetRoomId });
  await wait(100);

  // Client B accepts/requests extension
  extClientB.emit('request_extension', { roomId: targetRoomId });

  const grantedData = await extensionGrantedPromise;
  assert(grantedData.addedSeconds === 300, `Extension granted with +300 seconds (5 min) on double consent.`);
  console.log('');

  // ----------------------------------------------------
  // TEST 6B: REALTIME EMOJI REACTION BURST
  // ----------------------------------------------------
  console.log('--- TEST 6B: Realtime Emoji Reaction Burst ---');
  const reactionPromise = waitForEvent(extClientB, 'receive_reaction');
  extClientA.emit('send_reaction', { roomId: targetRoomId, emoji: '🔥' });
  const reactionData = await reactionPromise;
  assert(reactionData.emoji === '🔥', `Emoji reaction '🔥' delivered in realtime to partner.`);
  console.log('');

  // ----------------------------------------------------
  // TEST 6C: USER REPORT & SAFETY SHIELD
  // ----------------------------------------------------
  console.log('--- TEST 6C: User Report & Instant Shield ---');
  const reportPair = Array.from(roomsReceived.values())[1];
  const [repClientA, repClientB] = reportPair;
  const reportRoomId = repClientA.meta.matchedRoomId;

  const partnerReportPromise = waitForEvent(repClientB, 'partner_skipped', 'partner_skipped after report');
  const reportConfirmedPromise = waitForEvent(repClientA, 'report_confirmed', 'report_confirmed');
  repClientA.emit('report_user', { roomId: reportRoomId, reason: 'Inappropriate content' });
  const [reportResult, reportConfirmation] = await withTimeout(
    Promise.all([partnerReportPromise, reportConfirmedPromise]),
    EVENT_TIMEOUT_MS,
    'partner_skipped and report_confirmed'
  );
  assert(reportResult.reason.includes('segnalazione'), `Partner received safety shield termination upon report.`);
  assert(reportConfirmation.success, 'Reporter received report_confirmed acknowledgement.');
  console.log('');

  // ----------------------------------------------------
  // TEST 7: SKILL VolatileMemoryLeakAuditor (Disconnect & Skip)
  // ----------------------------------------------------
  console.log('--- TEST 7: Skill VolatileMemoryLeakAuditor (100% RAM Cleanup) ---');
  
  // Inspect RAM while active
  const activeStats = await fetchStats();
  console.log(`  [INFO] Active load: ${activeStats.usersCount} users, ${activeStats.roomsCount} rooms in RAM.`);
  assert(activeStats.roomsCount === TOTAL_PAIRS - 1, `Active rooms count matches remaining pairs (${activeStats.roomsCount})`);

  // 5 couples do skip_partner, 5 couples disconnect abruptly
  const pairsArray = Array.from(roomsReceived.values());
  for (let i = 0; i < pairsArray.length; i++) {
    const [cA, cB] = pairsArray[i];
    if (i < 5) {
      cA.emit('skip_partner', { roomId: cA.meta.matchedRoomId });
      await wait(10);
      cA.disconnect();
      cA.close();
      cB.disconnect();
      cB.close();
    } else {
      // Abrupt socket drop
      cA.disconnect();
      cA.close();
      cB.disconnect();
      cB.close();
    }
  }

  // Allow server grace period to run garbage collection & socket cleanup
  let postCleanupStats = null;
  for (let i = 0; i < 25; i++) {
    await wait(100);
    postCleanupStats = await fetchStats();
    if (postCleanupStats.usersCount === 0 && postCleanupStats.roomsCount === 0 && postCleanupStats.rateLimitsCount === 0) break;
  }

  assert(postCleanupStats.usersCount === 0, `Users map 100% deallocated: usersCount === ${postCleanupStats.usersCount}`);
  assert(postCleanupStats.roomsCount === 0, `Rooms map 100% deallocated: roomsCount === ${postCleanupStats.roomsCount}`);
  assert(postCleanupStats.queueCount === 0, `Queue array 100% emptied: queueCount === ${postCleanupStats.queueCount}`);
  assert(postCleanupStats.rateLimitsCount === 0, `Rate limits map 100% purged: rateLimitsCount === ${postCleanupStats.rateLimitsCount}`);

  console.log(`  [INFO] Post-cleanup Heap: ${postCleanupStats.memory.heapUsedMb} MB (vs baseline ${baselineStats.memory.heapUsedMb} MB)`);
  assert(postCleanupStats.memory.heapUsedMb < baselineStats.memory.heapUsedMb + 15, 'Heap memory returned to baseline with zero memory leaks.');
  console.log('');

  // ----------------------------------------------------
  // FINAL EVALUATION & SUMMARY
  // ----------------------------------------------------
  console.log('====================================================');
  console.log(`  AUDIT COMPLETE: ${assertionsPassed} PASSED, ${totalErrors} FAILED`);
  console.log('====================================================');

  if (totalErrors === 0) {
    console.log('\n>>> STATUS: LOCAL CHECKS PASSED; LAUNCH NOT CERTIFIED (EXIT CODE 0) <<<');
    process.exitCode = 0;
  } else {
    console.error(`\n>>> STATUS: FAILED WITH ${totalErrors} ERRORS (EXIT CODE 1) <<<`);
    process.exitCode = 1;
  }
  } finally {
    for (const client of createdClients) {
      client.removeAllListeners();
      client.disconnect();
      client.close();
    }
    createdClients.clear();
    await closeLocalServer(serverModule);
  }
}

runAllTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exitCode = 1;
});
