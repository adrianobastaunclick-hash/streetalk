const crypto = require('crypto');

// ==========================================
// 1. DATA SCHEMA & HIERARCHICAL MACRO-CATEGORIES
// ==========================================
const MACRO_CATEGORIES = Object.freeze([
  {
    id: 'flirt_connections',
    title: 'FLIRT & CONNESSIONI',
    slug: 'flirt-connessioni',
    badge: 'ESCLUSIVO UNDRESSED',
    description: '10 minuti al buio. Tre verità svelate. Tu e uno sconosciuto: restate o vi rivestite?',
    subcategories: [
      {
        id: 'after_dark',
        slug: 'after-dark',
        title: 'After Dark | Tensione a Orologeria',
        description: 'Niente volti, niente chiacchiere da bar. Solo dettagli, ombre e 45 secondi a risposta. Riuscirai a reggere lo sguardo dell\'IA prima che scada il tempo?',
        mode: 'undressed_engine',
        engineConfig: {
          roomType: 'after_dark',
          totalDurationSeconds: 600, // 10 min
          responseWindowSeconds: 45, // 45s turns
          slotsDefinition: [
            {
              index: 1,
              name: 'Il Dettaglio',
              description: 'Macro ravvicinata su labbra, collo/clavicola o mani.',
              placeholderText: 'Il Dettaglio — Uno sguardo, il collo, le mani, le labbra. Il tuo punto di non ritorno.',
              type: 'image'
            },
            {
              index: 2,
              name: 'L\'Ombra',
              description: 'Silhouette in penombra o profilo dell\'outfit (nessun volto visibile frontale).',
              placeholderText: 'L\'Ombra — Silhouette, penombra o il profilo del tuo outfit. Fai intravedere, non rivelare.',
              type: 'image'
            },
            {
              index: 3,
              name: 'Il Segno',
              description: 'Tatuaggio, cicatrice o frammento nascosto.',
              placeholderText: 'Il Segno — Un tatuaggio, una cicatrice, un frammento nascosto. Racconta una storia sulla tua pelle.',
              type: 'image'
            }
          ]
        }
      },
      {
        id: 'soul_talk',
        slug: 'soul-talk',
        title: 'Soul Talk | Lo Specchio del Tempo',
        description: 'Chi eri prima di imparare a proteggerti? Mostra chi sei stato da bambino, condividi le tue crepe e scopri se esiste ancora qualcuno capace di guardarti per davvero.',
        mode: 'undressed_engine',
        engineConfig: {
          roomType: 'soul_talk',
          totalDurationSeconds: 900, // 15 min
          responseWindowSeconds: 90, // 90s turns
          slotsDefinition: [
            {
              index: 1,
              name: 'L\'Origine',
              description: 'Foto d\'infanzia da piccoli (scansione o foto scattata a una vecchia polaroid/foto cartacea) oppure un oggetto iconico dell\'infanzia.',
              placeholderText: 'L\'Origine — Una vecchia foto di te da piccolo (anche scansionata o fotografata da un album) o un oggetto d\'infanzia. Prima di ogni maschera.',
              type: 'image'
            },
            {
              index: 2,
              name: 'Il Presente',
              description: 'Macro naturale degli occhi o sorriso spontaneo, senza filtri.',
              placeholderText: 'Il Presente — Una macro pulita dei tuoi occhi oggi. Senza filtri, senza pose da social.',
              type: 'image'
            },
            {
              index: 3,
              name: 'Il Rifugio',
              description: 'Angolo sicuro della propria stanza, un libro aperto, una tazza o la finestra al tramonto.',
              placeholderText: 'Il Rifugio — La pagina di un libro, una tazza fumante o l\'angolo della stanza dove ti senti al sicuro.',
              type: 'image'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'confession_wall',
    title: 'CONFESSIONI & SFOGO',
    slug: 'confession-wall',
    badge: '180 SECONDI',
    description: 'Scambia un pensiero inconfessabile in totale anonimato. Senza foto, senza account, senza log.',
    subcategories: [
      {
        id: 'standard_cazzeggio',
        slug: 'cazzeggio',
        title: 'Cazzeggio Notturno',
        description: 'Chiacchiere leggere tra sconosciuti per passare la notte.',
        mode: 'standard_chat'
      },
      {
        id: 'standard_sfogati',
        slug: 'sfogati',
        title: 'Sfogati Libero',
        description: 'Confessioni e pensieri intimi senza paura del giudizio.',
        mode: 'standard_chat'
      }
    ]
  },
  {
    id: 'agora',
    title: 'AGORÀ & TAVOLI APERTI',
    slug: 'agora-underground',
    badge: 'COMMUNITY',
    description: 'Tavoli di discussione underground creati dalla community e dai Fondatori.',
    subcategories: [
      {
        id: 'agora_bacheca',
        slug: 'bacheca-pubblica',
        title: 'Bacheca della Notte',
        description: 'Leggi e reagisci alle confessioni anonime più votate della strada.',
        mode: 'confession_wall'
      }
    ]
  }
]);

// Copywriting Scripts for AI Game Master
const UNDRESSED_AI_SCRIPTS = Object.freeze({
  after_dark: {
    start: 'Porte chiuse. Schermo acceso. Avete 10 minuti e nessuna maschera. Livello 1: Le parole prima dei corpi. Rispondete in 45 secondi.',
    phase2: 'I contorni cominciano a definirsi. Guardate i dettagli dell\'altro. Descrivete esattamente cosa state provando senza usare parole scontate.',
    phase3: 'Il tempo del testo è sospeso. Sblocco del segno finale. Registrate un sussurro vocale di 5 secondi: fate sentire chi c\'è dietro lo schermo.',
    verdict: 'Il tempo è scaduto. Il gioco è finito. La scelta adesso è reale. 30 secondi per decidere.'
  },
  soul_talk: {
    start: 'Benvenuti nella stanza della verità. Lasciate fuori chi fingete di essere ogni giorno. Livello 1: Trovate un punto di contatto.',
    phase2_mirror: 'Fermatevi. Guardate lo schermo. Prima di incontrare il mondo, eravate questo. Avete 60 secondi: cosa direste a quel bambino se poteste parlargli adesso?',
    phase3_refuge: 'Il presente e il rifugio si aprono. Avete visto le crepe: è il momento di condividere una vulnerabilità autentica.',
    verdict: 'Il tempo è scaduto. Il gioco è finito. La scelta adesso è reale. 30 secondi per decidere.'
  }
});

// ==========================================
// 2. PRE-MATCH "VAULT": STORAGE & MODERATION (HOURLY TTL)
// ==========================================
// Volatile Map: storageKey -> { key, dataUrl, mimeType, createdAt, roomId, ip }
const vaultStorage = new Map();
const VAULT_TTL_MS = 60 * 60 * 1000; // 1 hour TTL

function moderateMedia(fileData, mimeType) {
  if (typeof fileData !== 'string' || !fileData.startsWith('data:image/')) {
    return { valid: false, error: 'Formato multimediale non valido. Richiesta immagine valida.' };
  }
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const detectedMime = (mimeType || fileData.substring(5, fileData.indexOf(';'))).toLowerCase();
  if (!allowedMimes.includes(detectedMime)) {
    return { valid: false, error: 'Tipo MIME non supportato. Usa JPEG, PNG o WebP.' };
  }

  // Max 4MB in base64 (~5.4M characters)
  if (fileData.length > 5.5 * 1024 * 1024) {
    return { valid: false, error: 'Il file supera la dimensione massima consentita di 4MB.' };
  }

  // Reject embedded script tags or svg exploits
  if (/<script|javascript:|svg\s+onload/i.test(fileData)) {
    return { valid: false, error: 'Contenuto multimediale respinto dai filtri di sicurezza.' };
  }

  return { valid: true, mimeType: detectedMime };
}

function saveVaultSlot(slotIndex, fileData, mimeType, clientIp) {
  const mod = moderateMedia(fileData, mimeType);
  if (!mod.valid) return { ok: false, error: mod.error };

  const storageKey = `vault_${crypto.randomUUID().substring(0, 12)}_slot${slotIndex}`;
  vaultStorage.set(storageKey, {
    key: storageKey,
    slotIndex: Number(slotIndex),
    dataUrl: fileData,
    mimeType: mod.mimeType,
    createdAt: Date.now(),
    ip: clientIp
  });

  return { ok: true, storageKey };
}

function cleanVaultStorage(storageKeys) {
  if (!Array.isArray(storageKeys)) return 0;
  let count = 0;
  for (const k of storageKeys) {
    if (k && vaultStorage.has(k)) {
      vaultStorage.delete(k);
      count++;
    }
  }
  return count;
}

function sweepExpiredVaultStorage() {
  const now = Date.now();
  for (const [key, item] of vaultStorage.entries()) {
    if (now - item.createdAt > VAULT_TTL_MS) {
      vaultStorage.delete(key);
    }
  }
}
const vaultSweeper = setInterval(sweepExpiredVaultStorage, 5 * 60 * 1000);
if (vaultSweeper && vaultSweeper.unref) vaultSweeper.unref();

// ==========================================
// 3. UNDRESSED MATCHMAKING ENGINE & QUEUES
// ==========================================
const undressedQueues = {
  after_dark: [],
  soul_talk: []
};

// Rooms map: roomId -> RoomState
const undressedRooms = new Map();

function findUndressedMatch(candidate) {
  const q = undressedQueues[candidate.roomType];
  if (!q) return null;

  for (let i = 0; i < q.length; i++) {
    const waiter = q[i];

    if (waiter.socketId === candidate.socketId) continue;
    if (process.env.NODE_ENV !== 'test' && waiter.ip === candidate.ip) continue;

    // Gender compatibility
    const candMatchesWaiter = waiter.targetGender === 'Tutti' || waiter.targetGender === candidate.gender;
    const waiterMatchesCand = candidate.targetGender === 'Tutti' || candidate.targetGender === waiter.gender;

    if (candMatchesWaiter && waiterMatchesCand) {
      q.splice(i, 1);
      return waiter;
    }
  }
  return null;
}

function removeUndressedFromQueue(socketId) {
  let removed = false;
  for (const rType of ['after_dark', 'soul_talk']) {
    const q = undressedQueues[rType];
    const idx = q.findIndex((w) => w.socketId === socketId);
    if (idx !== -1) {
      const waiter = q.splice(idx, 1)[0];
      // Wipe their vault slots immediately if leaving queue
      if (waiter && waiter.storageKeys) {
        cleanVaultStorage(waiter.storageKeys);
      }
      removed = true;
    }
  }
  return removed;
}

// ==========================================
// 4. UNDRESSED ROOM LIFECYCLE & AI GAME MASTER
// ==========================================
function createUndressedRoom(io, userA, userB, roomType) {
  const roomId = `undressed_${crypto.randomUUID().substring(0, 8)}`;
  const isSoul = roomType === 'soul_talk';
  const totalDuration = isSoul ? 900 : 600; // 15 min or 10 min
  const turnDuration = isSoul ? 90 : 45; // 90s or 45s

  const sockA = io.sockets.sockets.get(userA.socketId);
  const sockB = io.sockets.sockets.get(userB.socketId);

  if (!sockA || !sockB) {
    if (userA && userA.storageKeys) cleanVaultStorage(userA.storageKeys);
    if (userB && userB.storageKeys) cleanVaultStorage(userB.storageKeys);
    return null;
  }

  sockA.join(roomId);
  sockB.join(roomId);

  const room = {
    id: roomId,
    roomType,
    user1: userA.socketId,
    user2: userB.socketId,
    ip1: userA.ip,
    ip2: userB.ip,
    moniker1: userA.moniker || 'Shadow_01',
    moniker2: userB.moniker || 'Viper_02',
    avatar1: userA.avatar || '⚡',
    avatar2: userB.avatar || '⚡',
    slots1: userA.slots, // { 1: url, 2: url, 3: url }
    slots2: userB.slots,
    storageKeys1: userA.storageKeys || [],
    storageKeys2: userB.storageKeys || [],
    phase: 'PHASE_1',
    totalDuration,
    timeRemaining: totalDuration,
    turnDuration,
    turnTimeRemaining: turnDuration,
    inputLocked: true,
    inputLockCountdown: 5,
    timerInterval: null,
    verdictChoices: new Map(), // socketId -> 'yes' | 'no'
    verdictTimeout: null,
    createdAt: Date.now()
  };

  undressedRooms.set(roomId, room);

  // Send initial Match event with partner info and initial phase 1 state
  const startAiScript = isSoul ? UNDRESSED_AI_SCRIPTS.soul_talk.start : UNDRESSED_AI_SCRIPTS.after_dark.start;

  sockA.emit('undressed_match_found', {
    roomId,
    roomType,
    totalDuration,
    turnDuration,
    partner: {
      moniker: room.moniker2,
      avatar: room.avatar2,
      slots: {
        1: { url: room.slots2[1], unlocked: false, name: isSoul ? 'L\'Origine' : 'Il Dettaglio' },
        2: { url: room.slots2[2], unlocked: false, name: isSoul ? 'Il Presente' : 'L\'Ombra' },
        3: { url: room.slots2[3], unlocked: false, name: isSoul ? 'Il Rifugio' : 'Il Segno' }
      }
    },
    aiAnnouncement: startAiScript,
    phase: 'PHASE_1',
    inputLocked: true,
    lockCountdown: 5
  });

  sockB.emit('undressed_match_found', {
    roomId,
    roomType,
    totalDuration,
    turnDuration,
    partner: {
      moniker: room.moniker1,
      avatar: room.avatar1,
      slots: {
        1: { url: room.slots1[1], unlocked: false, name: isSoul ? 'L\'Origine' : 'Il Dettaglio' },
        2: { url: room.slots1[2], unlocked: false, name: isSoul ? 'Il Presente' : 'L\'Ombra' },
        3: { url: room.slots1[3], unlocked: false, name: isSoul ? 'Il Rifugio' : 'Il Segno' }
      }
    },
    aiAnnouncement: startAiScript,
    phase: 'PHASE_1',
    inputLocked: true,
    lockCountdown: 5
  });

  // Start 1-second server synchronized countdown
  room.timerInterval = setInterval(() => {
    room.timeRemaining -= 1;
    room.turnTimeRemaining -= 1;

    if (room.turnTimeRemaining <= 0) {
      room.turnTimeRemaining = room.turnDuration;
    }

    if (room.inputLockCountdown > 0) {
      room.inputLockCountdown -= 1;
      if (room.inputLockCountdown <= 0) {
        room.inputLocked = false;
        io.to(roomId).emit('undressed_lockout_ended');
      }
    }

    // Sync timer tick to clients
    io.to(roomId).emit('undressed_timer_tick', {
      timeRemaining: room.timeRemaining,
      turnTimeRemaining: room.turnTimeRemaining,
      inputLocked: room.inputLocked,
      lockCountdown: room.inputLockCountdown
    });

    // ----------------------------------------------------
    // TIMELINE LOGIC & AI GAME MASTER DIRECTING
    // ----------------------------------------------------
    const elapsed = room.totalDuration - room.timeRemaining;

    if (!isSoul) {
      // ===== AFTER DARK TIMELINE (10 min = 600s) =====
      // Min 3 (elapsed = 180s): PHASE 2 — Sblocco Slot 1 e Slot 2
      if (elapsed === 180 && room.phase === 'PHASE_1') {
        room.phase = 'PHASE_2';
        room.inputLocked = true;
        room.inputLockCountdown = 6;
        const msg = UNDRESSED_AI_SCRIPTS.after_dark.phase2;

        io.to(roomId).emit('undressed_phase_change', {
          phase: 'PHASE_2',
          aiAnnouncement: msg,
          unlockSlots: [1, 2],
          lockCountdown: 6
        });
      }

      // Min 7 (elapsed = 420s): PHASE 3 — Sblocco Slot 3 + Micro-vocale
      if (elapsed === 420 && room.phase === 'PHASE_2') {
        room.phase = 'PHASE_3';
        room.inputLocked = true;
        room.inputLockCountdown = 6;
        const msg = UNDRESSED_AI_SCRIPTS.after_dark.phase3;

        io.to(roomId).emit('undressed_phase_change', {
          phase: 'PHASE_3',
          aiAnnouncement: msg,
          unlockSlots: [3],
          voiceRequired: true,
          lockCountdown: 6
        });
      }
    } else {
      // ===== SOUL TALK TIMELINE (15 min = 900s) =====
      // Min 5 (elapsed = 300s): PHASE 2 — Momento Specchio del Tempo (Blackout 5s + Sblocco Slot 1)
      if (elapsed === 300 && room.phase === 'PHASE_1') {
        room.phase = 'PHASE_2';
        room.inputLocked = true;
        room.inputLockCountdown = 15; // 5s blackout + forced silence

        io.to(roomId).emit('undressed_blackout_moment', { durationSeconds: 5 });

        setTimeout(() => {
          if (!undressedRooms.has(roomId)) return;
          const msg = UNDRESSED_AI_SCRIPTS.soul_talk.phase2_mirror;
          io.to(roomId).emit('undressed_phase_change', {
            phase: 'PHASE_2',
            aiAnnouncement: msg,
            unlockSlots: [1],
            lockCountdown: 10
          });
        }, 5000);
      }

      // Min 10 (elapsed = 600s): PHASE 3 — Il Presente e il Rifugio (Sblocco Slot 2 e 3)
      if (elapsed === 600 && room.phase === 'PHASE_2') {
        room.phase = 'PHASE_3';
        room.inputLocked = true;
        room.inputLockCountdown = 6;
        const msg = UNDRESSED_AI_SCRIPTS.soul_talk.phase3_refuge;

        io.to(roomId).emit('undressed_phase_change', {
          phase: 'PHASE_3',
          aiAnnouncement: msg,
          unlockSlots: [2, 3],
          lockCountdown: 6
        });
      }
    }

    // ----------------------------------------------------
    // VERDICT PHASE TRIGGER (TIME EXPIRED)
    // ----------------------------------------------------
    if (room.timeRemaining <= 0) {
      clearInterval(room.timerInterval);
      room.timerInterval = null;
      room.phase = 'VERDICT';

      const finalScript = isSoul ? UNDRESSED_AI_SCRIPTS.soul_talk.verdict : UNDRESSED_AI_SCRIPTS.after_dark.verdict;

      io.to(roomId).emit('undressed_verdict_start', {
        phase: 'VERDICT',
        secondsRemaining: 30,
        aiAnnouncement: finalScript,
        choices: isSoul
          ? { yes: 'RESTA CON ME', no: 'BUON VIAGGIO' }
          : { yes: 'ACCENDI LA LUCE', no: 'SPEGNI TUTTO' }
      });

      // 30 seconds verdict timeout: if not resolved, automatically destroy
      room.verdictTimeout = setTimeout(() => {
        resolveUndressedVerdict(io, roomId, 'timeout');
      }, 30000);
    }
  }, 1000);

  return room;
}

function resolveUndressedVerdict(io, roomId, forcedReason) {
  const room = undressedRooms.get(roomId);
  if (!room) return;

  if (room.verdictTimeout) {
    clearTimeout(room.verdictTimeout);
    room.verdictTimeout = null;
  }

  const choiceA = room.verdictChoices.get(room.user1);
  const choiceB = room.verdictChoices.get(room.user2);

  const isDoubleYes = choiceA === 'yes' && choiceB === 'yes' && !forcedReason;

  if (isDoubleYes) {
    // MATCH CONFIRMED (DOPPIO SÌ)
    const permanentThreadId = `perm_${crypto.randomUUID().substring(0, 10)}`;
    io.to(roomId).emit('undressed_verdict_result', {
      result: 'connected',
      permanentThreadId,
      message: 'Connessione confermata! Tutti i filtri blur rimossi.'
    });

    // Mark room as converted, preserve storage
    room.phase = 'CONNECTED';
  } else {
    // REJECTION OR TIMEOUT (ZERO FOOTPRINT AUTODESTRUCTION)
    io.to(roomId).emit('undressed_verdict_result', {
      result: 'destroyed',
      reason: forcedReason || 'Accordo non raggiunto. Stanza distrutta con effetto zero footprint.'
    });

    destroyUndressedRoom(io, roomId, 'verdict_rejected');
  }
}

function destroyUndressedRoom(io, roomId, reason = 'terminated') {
  const room = undressedRooms.get(roomId);
  if (!room) return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  if (room.verdictTimeout) {
    clearTimeout(room.verdictTimeout);
    room.verdictTimeout = null;
  }

  // Instant zero-footprint wipe of vault storage files
  cleanVaultStorage(room.storageKeys1);
  cleanVaultStorage(room.storageKeys2);

  const sockA = io.sockets.sockets.get(room.user1);
  const sockB = io.sockets.sockets.get(room.user2);

  if (sockA) sockA.leave(roomId);
  if (sockB) sockB.leave(roomId);

  undressedRooms.delete(roomId);
}

// ==========================================
// 5. SOCKET HANDLERS REGISTRATION
// ==========================================
function registerUndressedSocketHandlers(io, socket, getClientIp, checkRateLimit) {
  const clientIp = getClientIp(socket);

  // 1. JOIN UNDRESSED QUEUE
  socket.on('join_undressed_queue', (payload) => {
    if (!checkRateLimit(socket)) {
      return socket.emit('error_event', { code: 'RATE_LIMIT', message: 'Troppe richieste. Rallenta.' });
    }

    if (!payload || typeof payload !== 'object') {
      return socket.emit('error_event', { code: 'INVALID_PAYLOAD', message: 'Payload non valido' });
    }

    const { roomType, gender, targetGender, slots, moniker, avatar } = payload;
    if (!['after_dark', 'soul_talk'].includes(roomType)) {
      return socket.emit('error_event', { code: 'INVALID_ROOM_TYPE', message: 'Tipo di stanza non valido' });
    }

    // Must have all 3 slots validated
    if (!slots || !slots[1] || !slots[2] || !slots[3]) {
      return socket.emit('error_event', {
        code: 'VAULT_INCOMPLETE',
        message: 'Tutti e 3 gli slot del Vault devono essere caricati e validati prima dell\'ingresso in coda.'
      });
    }

    // Save and moderate each slot
    const storageKeys = [];
    const savedSlots = {};

    for (const idx of [1, 2, 3]) {
      const s = slots[idx];
      const saved = saveVaultSlot(idx, s.fileData, s.mimeType, clientIp);
      if (!saved.ok) {
        cleanVaultStorage(storageKeys);
        return socket.emit('error_event', {
          code: 'VAULT_MODERATION_FAILED',
          message: `Slot ${idx}: ${saved.error}`
        });
      }
      storageKeys.push(saved.storageKey);
      savedSlots[idx] = s.fileData;
    }

    removeUndressedFromQueue(socket.id);

    const candidate = {
      socketId: socket.id,
      ip: clientIp,
      roomType,
      gender: gender || 'Tutti',
      targetGender: targetGender || 'Tutti',
      moniker: moniker || 'Shadow_X',
      avatar: avatar || '⚡',
      slots: savedSlots,
      storageKeys,
      joinedAt: Date.now()
    };

    const match = findUndressedMatch(candidate);
    if (match) {
      createUndressedRoom(io, match, candidate, roomType);
    } else {
      undressedQueues[roomType].push(candidate);
      socket.emit('undressed_queue_joined', {
        position: undressedQueues[roomType].length,
        roomType,
        onlineCount: io.engine.clientsCount
      });
    }
  });

  // 2. LEAVE UNDRESSED QUEUE
  socket.on('leave_undressed_queue', () => {
    removeUndressedFromQueue(socket.id);
    socket.emit('undressed_queue_left', { success: true });
  });

  // 3. SEND MESSAGE IN UNDRESSED ROOM
  socket.on('send_undressed_message', (payload) => {
    if (!checkRateLimit(socket)) return;
    if (!payload || !payload.roomId) return;

    const room = undressedRooms.get(payload.roomId);
    if (!room) {
      return socket.emit('error_event', { code: 'ROOM_NOT_FOUND', message: 'Stanza inesistente o chiusa.' });
    }

    if (room.user1 !== socket.id && room.user2 !== socket.id) {
      return socket.emit('error_event', { code: 'UNAUTHORIZED', message: 'Non appartieni a questa stanza.' });
    }

    // Check Input Lockout
    if (room.inputLocked) {
      return socket.emit('error_event', {
        code: 'INPUT_LOCKED',
        message: 'Input attualmente bloccato dall\'annuncio dell\'IA.'
      });
    }

    const isUser1 = room.user1 === socket.id;
    const senderMoniker = isUser1 ? room.moniker1 : room.moniker2;

    if (payload.type === 'voice') {
      // 5-second voice note
      const audioData = payload.audioData;
      if (typeof audioData !== 'string' || !audioData.startsWith('data:audio/')) {
        return socket.emit('error_event', { code: 'INVALID_AUDIO', message: 'File audio non valido' });
      }

      io.to(room.id).emit('receive_undressed_message', {
        id: `voice_${crypto.randomUUID().substring(0, 8)}`,
        senderId: socket.id,
        senderMoniker,
        type: 'voice',
        audioData,
        audioDurationSeconds: Math.min(Number(payload.duration) || 5, 5),
        timestamp: Date.now()
      });
    } else {
      // Standard text message
      const text = typeof payload.message === 'string' ? payload.message.trim() : '';
      if (!text || text.length > 500) {
        return socket.emit('error_event', { code: 'INVALID_MESSAGE', message: 'Messaggio non valido' });
      }

      io.to(room.id).emit('receive_undressed_message', {
        id: `msg_${crypto.randomUUID().substring(0, 8)}`,
        senderId: socket.id,
        senderMoniker,
        type: 'text',
        text,
        timestamp: Date.now()
      });
    }
  });

  // 4. VERDICT DECISION
  socket.on('send_undressed_verdict', (payload) => {
    if (!checkRateLimit(socket)) return;
    if (!payload || !payload.roomId || !['yes', 'no'].includes(payload.decision)) return;

    const room = undressedRooms.get(payload.roomId);
    if (!room || room.phase !== 'VERDICT') return;

    room.verdictChoices.set(socket.id, payload.decision);

    // If single 'no', instant resolution to destroy
    if (payload.decision === 'no') {
      resolveUndressedVerdict(io, room.id, 'rejected');
      return;
    }

    // If both answered, resolve
    if (room.verdictChoices.size >= 2) {
      resolveUndressedVerdict(io, room.id);
    } else {
      // Notify other user that partner answered
      socket.to(room.id).emit('undressed_partner_voted');
    }
  });

  // 5. ABORT / CLEANUP
  socket.on('abort_undressed_session', (payload) => {
    if (payload && payload.roomId) {
      destroyUndressedRoom(io, payload.roomId, 'aborted');
    }
    removeUndressedFromQueue(socket.id);
  });
}

// ==========================================
// 6. REST API ENDPOINTS REGISTRATION
// ==========================================
function registerUndressedRestEndpoints(app, getClientIp) {
  // GET /api/categories — Returns hierarchical 2-level macro-categories
  app.get('/api/categories', (req, res) => {
    res.json({
      ok: true,
      categories: MACRO_CATEGORIES
    });
  });

  // GET /api/categories/:macroId — Returns single macro-category
  app.get('/api/categories/:macroId', (req, res) => {
    const macro = MACRO_CATEGORIES.find((m) => m.id === req.params.macroId);
    if (!macro) {
      return res.status(404).json({ ok: false, error: 'Macro-categoria non trovata' });
    }
    res.json({ ok: true, category: macro });
  });

  // POST /api/vault/upload — Upload and moderate 3 slots
  app.post('/api/vault/upload', (req, res) => {
    const clientIp = getClientIp(req);
    const { slotIndex, fileData, mimeType } = req.body || {};

    if (!slotIndex || ![1, 2, 3].includes(Number(slotIndex))) {
      return res.status(400).json({ ok: false, error: 'Indice slot non valido (1, 2 o 3)' });
    }

    const result = saveVaultSlot(slotIndex, fileData, mimeType, clientIp);
    if (!result.ok) {
      return res.status(422).json({ ok: false, error: result.error });
    }

    res.status(201).json({
      ok: true,
      storageKey: result.storageKey,
      expiresInSeconds: 3600
    });
  });

  // POST /api/vault/cleanup — Instant Zero-Footprint deletion
  app.post('/api/vault/cleanup', (req, res) => {
    const { storageKeys, roomId } = req.body || {};
    let deletedCount = 0;

    if (Array.isArray(storageKeys)) {
      deletedCount += cleanVaultStorage(storageKeys);
    }

    if (roomId && undressedRooms.has(roomId)) {
      const r = undressedRooms.get(roomId);
      cleanVaultStorage(r.storageKeys1);
      cleanVaultStorage(r.storageKeys2);
      undressedRooms.delete(roomId);
    }

    res.json({
      ok: true,
      deletedCount,
      zeroFootprint: true
    });
  });
}

module.exports = {
  MACRO_CATEGORIES,
  UNDRESSED_AI_SCRIPTS,
  vaultStorage,
  undressedQueues,
  undressedRooms,
  moderateMedia,
  saveVaultSlot,
  cleanVaultStorage,
  sweepExpiredVaultStorage,
  findUndressedMatch,
  createUndressedRoom,
  destroyUndressedRoom,
  resolveUndressedVerdict,
  removeUndressedFromQueue,
  registerUndressedSocketHandlers,
  registerUndressedRestEndpoints
};
