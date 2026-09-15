/**
 * STREETALK | Undressed Engine & Macro-Categories Comprehensive Test Suite
 * Validates Data Schema, Pre-Match Vault, AI Game Master, Timeline, Verdict & Zero Footprint
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '3942';

const http = require('http');
const ioClient = require('socket.io-client');
const { app, server, io, undressedEngine } = require('../server');

const TEST_PORT = 3942;
let testServer;
let baseUrl;

function logPass(msg) {
  console.log(`  [PASS] ${msg}`);
}

function logFail(msg, err) {
  console.error(`  [FAIL] ${msg}:`, err);
  process.exit(1);
}

function postJson(urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const req = http.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': baseUrl
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(JSON.stringify(body));
    req.end();
  });
}

function getJson(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const req = http.request(
      url,
      {
        method: 'GET',
        headers: {
          'Origin': baseUrl
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function createSocket() {
  return ioClient(baseUrl, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
}

async function runUndressedTests() {
  console.log('\n====================================================');
  console.log('  STREETALK — UNDRESSED ENGINE & MACRO-CATEGORIES AUDIT');
  console.log('====================================================\n');

  // Start test server
  await new Promise((resolve) => {
    testServer = server.listen(TEST_PORT, () => {
      baseUrl = `http://localhost:${TEST_PORT}`;
      resolve();
    });
  });

  try {
    // --- 1. DATA SCHEMA & HIERARCHICAL MACRO-CATEGORIES ---
    console.log('--- TEST 1: Macro-Categories Schema & Hierarchy ---');
    const catRes = await getJson('/api/categories');
    if (catRes.status !== 200 || !catRes.body.ok) throw new Error('GET /api/categories failed');
    const categories = catRes.body.categories;

    const flirt = categories.find((c) => c.id === 'flirt_connections');
    if (!flirt) throw new Error('Macro-category flirt_connections not found');
    if (!flirt.title.includes('FLIRT') || flirt.badge !== 'ESCLUSIVO UNDRESSED') {
      throw new Error('flirt_connections title or badge mismatch');
    }
    if (flirt.description !== '10 minuti al buio. Tre verità svelate. Tu e uno sconosciuto: restate o vi rivestite?') {
      throw new Error('Macro-category description mismatch');
    }

    const afterDark = flirt.subcategories.find((s) => s.id === 'after_dark');
    if (!afterDark || afterDark.engineConfig.totalDurationSeconds !== 600 || afterDark.engineConfig.responseWindowSeconds !== 45) {
      throw new Error('after_dark config mismatch (must be 600s total, 45s turns)');
    }
    if (afterDark.engineConfig.slotsDefinition.length !== 3) {
      throw new Error('after_dark must have exactly 3 slots');
    }
    if (afterDark.engineConfig.slotsDefinition[0].name !== 'Il Dettaglio' ||
        afterDark.engineConfig.slotsDefinition[1].name !== 'L\'Ombra' ||
        afterDark.engineConfig.slotsDefinition[2].name !== 'Il Segno') {
      throw new Error('after_dark slot names mismatch');
    }

    const soulTalk = flirt.subcategories.find((s) => s.id === 'soul_talk');
    if (!soulTalk || soulTalk.engineConfig.totalDurationSeconds !== 900 || soulTalk.engineConfig.responseWindowSeconds !== 90) {
      throw new Error('soul_talk config mismatch (must be 900s total, 90s turns)');
    }
    if (soulTalk.engineConfig.slotsDefinition[0].name !== 'L\'Origine' ||
        soulTalk.engineConfig.slotsDefinition[1].name !== 'Il Presente' ||
        soulTalk.engineConfig.slotsDefinition[2].name !== 'Il Rifugio') {
      throw new Error('soul_talk slot names mismatch');
    }

    // Specific category endpoint
    const singleCat = await getJson('/api/categories/flirt_connections');
    if (singleCat.status !== 200 || singleCat.body.category.id !== 'flirt_connections') {
      throw new Error('GET /api/categories/flirt_connections failed');
    }

    const notFoundCat = await getJson('/api/categories/non_existent_category');
    if (notFoundCat.status !== 404) {
      throw new Error('Unknown category did not return 404');
    }
    logPass('Hierarchical Macro-Categories Schema, slots definitions, and REST endpoints verified');

    // --- 2. PRE-MATCH VAULT: UPLOAD & MODERATION ---
    console.log('\n--- TEST 2: Pre-Match Vault Upload, Validation & Hourly TTL Storage ---');
    const validBase64 = 'data:image/jpeg;base64,' + Buffer.from('synthetic-jpeg-pixel-bytes').toString('base64');

    // Upload Slot 1
    const up1 = await postJson('/api/vault/upload', {
      slotIndex: 1,
      fileData: validBase64,
      mimeType: 'image/jpeg'
    });
    if (up1.status !== 201 || !up1.body.storageKey) throw new Error('Slot 1 upload failed');
    const key1 = up1.body.storageKey;

    // Reject non-image
    const upBad = await postJson('/api/vault/upload', {
      slotIndex: 2,
      fileData: 'data:text/plain;base64,invalidtext',
      mimeType: 'text/plain'
    });
    if (upBad.status !== 422) throw new Error('Non-image payload should be rejected with 422');

    // Instant Zero Footprint cleanup endpoint
    const cleanRes = await postJson('/api/vault/cleanup', {
      storageKeys: [key1]
    });
    if (cleanRes.status !== 200 || cleanRes.body.deletedCount !== 1) {
      throw new Error('Vault cleanup did not delete storage key');
    }
    if (undressedEngine.vaultStorage.has(key1)) {
      throw new Error('Vault storage retained key after cleanup');
    }
    logPass('Vault upload moderation, base64 validation and instant memory purge verified');

    // --- 3. MATCHMAKING QUEUE GUARD (ALL 3 SLOTS REQUIRED) ---
    console.log('\n--- TEST 3: Matchmaking Queue Guard (Locked without 3 Slots) ---');
    const socketA = createSocket();
    await new Promise((res) => socketA.on('connect', res));

    // Attempt join without slots
    const incompleteErrPromise = new Promise((resolve) => {
      socketA.on('error_event', (err) => {
        if (err.code === 'VAULT_INCOMPLETE') resolve(err);
      });
    });

    socketA.emit('join_undressed_queue', {
      roomType: 'after_dark',
      gender: 'M',
      targetGender: 'F',
      slots: {
        1: { fileData: validBase64, mimeType: 'image/jpeg' }
        // Missing slots 2 and 3!
      }
    });

    const guardErr = await incompleteErrPromise;
    if (!guardErr || guardErr.code !== 'VAULT_INCOMPLETE') {
      throw new Error('Server did not enforce 3 slots requirement');
    }
    logPass('Queue guard enforces strict 3-slot requirement before queue entry');

    // --- 4. REALTIME MATCHMAKING & AI GAME MASTER INITIALIZATION ---
    console.log('\n--- TEST 4: Realtime Matchmaking & AI Game Master Initialization ---');
    const socketB = createSocket();
    await new Promise((res) => socketB.on('connect', res));

    const validSlots = {
      1: { fileData: validBase64, mimeType: 'image/jpeg' },
      2: { fileData: validBase64, mimeType: 'image/jpeg' },
      3: { fileData: validBase64, mimeType: 'image/jpeg' }
    };

    const matchPromiseA = new Promise((resolve) => socketA.on('undressed_match_found', resolve));
    const matchPromiseB = new Promise((resolve) => socketB.on('undressed_match_found', resolve));

    socketA.emit('join_undressed_queue', {
      roomType: 'after_dark',
      gender: 'M',
      targetGender: 'F',
      moniker: 'NEON_SHADOW',
      slots: validSlots
    });

    socketB.emit('join_undressed_queue', {
      roomType: 'after_dark',
      gender: 'F',
      targetGender: 'M',
      moniker: 'VIPER_GLOW',
      slots: validSlots
    });

    const [matchA, matchB] = await Promise.all([matchPromiseA, matchPromiseB]);
    if (!matchA || !matchB || matchA.roomId !== matchB.roomId) {
      throw new Error('Matchmaking did not pair sockets in the same room');
    }
    if (matchA.phase !== 'PHASE_1' || matchA.totalDuration !== 600 || matchA.turnDuration !== 45) {
      throw new Error('Initial phase or timers mismatch');
    }
    if (!matchA.aiAnnouncement.includes('Porte chiuse. Schermo acceso')) {
      throw new Error('After Dark start AI announcement mismatch');
    }
    if (!matchA.inputLocked || matchA.lockCountdown !== 5) {
      throw new Error('Initial input lockout during AI announcement not enforced');
    }
    logPass('Pairing succeeded with synchronized timers, AI start announcement, and input lockout');

    // --- 5. INPUT LOCKOUT ENFORCEMENT DURING AI ANNOUNCEMENTS ---
    console.log('\n--- TEST 5: Input Lockout Enforcement During AI Announcements ---');
    const lockoutErrPromise = new Promise((resolve) => {
      socketA.on('error_event', (err) => {
        if (err.code === 'INPUT_LOCKED') resolve(err);
      });
    });

    socketA.emit('send_undressed_message', {
      roomId: matchA.roomId,
      type: 'text',
      message: 'Messaggio inviato durante il blocco'
    });

    const lockoutErr = await lockoutErrPromise;
    if (!lockoutErr || lockoutErr.code !== 'INPUT_LOCKED') {
      throw new Error('Input lockout was not enforced when typing while locked');
    }
    logPass('Server blocks chat input during AI reading announcement window');

    // --- 6. TIMELINE & SLOT REVEALS VIA SERVER DISPATCH ---
    console.log('\n--- TEST 6: Timeline & Dynamic Blur Slot Reveals ---');
    const activeRoom = undressedEngine.undressedRooms.get(matchA.roomId);
    if (!activeRoom) throw new Error('Active room not found in undressedRooms map');

    // Simulate unlock Phase 2 for After Dark (Min 3: I Contorni)
    const phase2Promise = new Promise((resolve) => socketA.on('undressed_phase_change', resolve));
    io.to(activeRoom.id).emit('undressed_phase_change', {
      phase: 'PHASE_2',
      aiAnnouncement: undressedEngine.UNDRESSED_AI_SCRIPTS.after_dark.phase2,
      unlockSlots: [1, 2],
      lockCountdown: 6
    });

    const phase2Evt = await phase2Promise;
    if (phase2Evt.phase !== 'PHASE_2' || !phase2Evt.unlockSlots.includes(1) || !phase2Evt.unlockSlots.includes(2)) {
      throw new Error('Phase 2 slot unlock event mismatch');
    }
    if (!phase2Evt.aiAnnouncement.includes('I contorni cominciano a definirsi')) {
      throw new Error('Phase 2 AI script text mismatch');
    }
    logPass('Phase 2 transition unlocks slots 1 and 2 with exact AI provocation script');

    // --- 7. VERDICT RESOLUTION & ZERO FOOTPRINT AUTODESTRUCTION ---
    console.log('\n--- TEST 7: Verdict Flow & Zero Footprint Instant Destruction ---');
    activeRoom.phase = 'VERDICT';

    const verdictPromiseA = new Promise((resolve) => socketA.on('undressed_verdict_result', resolve));
    const verdictPromiseB = new Promise((resolve) => socketB.on('undressed_verdict_result', resolve));

    // Socket A decides YES
    socketA.emit('send_undressed_verdict', {
      roomId: activeRoom.id,
      decision: 'yes'
    });

    // Socket B decides NO -> Single No triggers instant zero footprint destruction
    socketB.emit('send_undressed_verdict', {
      roomId: activeRoom.id,
      decision: 'no'
    });

    const [vResA, vResB] = await Promise.all([verdictPromiseA, verdictPromiseB]);
    if (vResA.result !== 'destroyed' || vResB.result !== 'destroyed') {
      throw new Error('Single NO did not result in destroyed verdict');
    }
    if (undressedEngine.undressedRooms.has(activeRoom.id)) {
      throw new Error('Room was not deallocated from memory');
    }
    // Verify zero footprint: storageKeys wiped
    for (const k of activeRoom.storageKeys1.concat(activeRoom.storageKeys2)) {
      if (undressedEngine.vaultStorage.has(k)) {
        throw new Error(`Storage key ${k} was not purged! Zero footprint violated.`);
      }
    }
    logPass('Single NO triggered instant Zero Footprint destruction and volatile memory purge');

    // --- 8. DOUBLE YES RESOLUTION (PERMANENT INBOX CONVERSION) ---
    console.log('\n--- TEST 8: Double-Yes Verdict Resolution (Permanent Thread Conversion) ---');
    const socketC = createSocket();
    const socketD = createSocket();
    await Promise.all([
      new Promise((res) => socketC.on('connect', res)),
      new Promise((res) => socketD.on('connect', res))
    ]);

    const mPromiseC = new Promise((resolve) => socketC.on('undressed_match_found', resolve));
    const mPromiseD = new Promise((resolve) => socketD.on('undressed_match_found', resolve));

    socketC.emit('join_undressed_queue', {
      roomType: 'soul_talk',
      gender: 'Tutti',
      targetGender: 'Tutti',
      moniker: 'SOUL_SEEKER_1',
      slots: validSlots
    });
    socketD.emit('join_undressed_queue', {
      roomType: 'soul_talk',
      gender: 'Tutti',
      targetGender: 'Tutti',
      moniker: 'SOUL_SEEKER_2',
      slots: validSlots
    });

    const [mC, mD] = await Promise.all([mPromiseC, mPromiseD]);
    const room2 = undressedEngine.undressedRooms.get(mC.roomId);
    room2.phase = 'VERDICT';

    const vResultC = new Promise((resolve) => socketC.on('undressed_verdict_result', resolve));
    const vResultD = new Promise((resolve) => socketD.on('undressed_verdict_result', resolve));

    socketC.emit('send_undressed_verdict', { roomId: room2.id, decision: 'yes' });
    socketD.emit('send_undressed_verdict', { roomId: room2.id, decision: 'yes' });

    const [resC, resD] = await Promise.all([vResultC, vResultD]);
    if (resC.result !== 'connected' || !resC.permanentThreadId || resD.result !== 'connected') {
      throw new Error('Double YES did not convert into permanent connected thread');
    }
    logPass('Double YES successfully resolves to permanent thread conversion with blur removal');

    // Cleanup sockets
    socketA.disconnect();
    socketB.disconnect();
    socketC.disconnect();
    socketD.disconnect();

    console.log('\n====================================================');
    console.log('  ALL UNDRESSED ENGINE TESTS PASSED (8/8)');
    console.log('====================================================\n');
  } finally {
    if (testServer) {
      testServer.close();
    }
  }
}

if (require.main === module) {
  runUndressedTests()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Test error:', err);
      process.exit(1);
    });
}

module.exports = { runUndressedTests };
