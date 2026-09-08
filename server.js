const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io initialization with open CORS
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

// ==========================================
// VOLATILE IN-MEMORY DATA STRUCTURES (RAM ONLY)
// ==========================================
// users: socketId -> { socketId, ip, gender, targetGender, mood, secret, roomId, joinedQueueAt }
const users = new Map();

// queues: dizionario con code FIFO separate per mood (cazzeggio, sfogati, flirt)
const queues = {
  cazzeggio: [],
  sfogati: [],
  flirt: []
};

// Backward compatibility helper/proxy for queue
const queue = new Proxy([], {
  get(target, prop) {
    const all = [
      ...(queues.cazzeggio || []),
      ...(queues.sfogati || []),
      ...(queues.flirt || []),
      ...Object.keys(queues)
        .filter(k => !['cazzeggio', 'sfogati', 'flirt'].includes(k))
        .flatMap(k => queues[k])
    ];
    if (prop === 'length') return all.length;
    if (prop === Symbol.iterator) return all[Symbol.iterator].bind(all);
    if (typeof all[prop] === 'function') {
      return all[prop].bind(all);
    }
    return all[prop];
  }
});

// rooms: roomId -> { id, user1: socketId, user2: socketId, ip1, ip2, secret1, secret2, mood, createdAt, timeRemaining, timerInterval, extensions: Set(socketId) }
const rooms = new Map();

// Rate limiter: socketId -> { count: number, resetTime: number }
const rateLimits = new Map();
const RATE_LIMIT_MAX_PER_SEC = 20;

// Temporary IP Jail: ip -> unjailTimestamp (RAM only, 10 minutes ban on reports)
const ipJail = new Map();
const reportCounts = new Map();
const DEFAULT_JAIL_TIME_MS = 10 * 60 * 1000; // 10 minutes (600,000 ms)

// Simulated online user count base (streetalk activity aesthetic)
let simulatedBaseOnline = 1248;

// ==========================================
// SKILL: DOMSafetyFilter (Server-Side Sanitizer)
// ==========================================
const DOMSafetyFilter = {
  escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },
  sanitize(str) {
    if (typeof str !== 'string') return '';
    return str.trim();
  }
};

// ==========================================
// SKILL: SocketContractValidator
// ==========================================
function validateJoinPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be a valid JSON object' };
  }
  const { gender, targetGender, mood, secret } = payload;

  const validGenders = ['M', 'F', 'NB', 'Tutti'];
  const validTargets = ['M', 'F', 'Tutti'];

  if (!gender || !validGenders.includes(gender)) {
    return { valid: false, error: `Invalid gender. Must be one of: ${validGenders.join(', ')}` };
  }
  if (!targetGender || !validTargets.includes(targetGender)) {
    return { valid: false, error: `Invalid targetGender. Must be one of: ${validTargets.join(', ')}` };
  }
  if (!mood || typeof mood !== 'string' || mood.trim().length === 0 || mood.trim().length > 30) {
    return { valid: false, error: 'Mood must be a non-empty string of max 30 characters' };
  }
  if (!secret || typeof secret !== 'string') {
    return { valid: false, error: 'Secret must be a valid string' };
  }

  const trimmedSecret = secret.trim();
  if (trimmedSecret.length < 3 || trimmedSecret.length > 90) {
    return { valid: false, error: 'Il segreto deve avere una lunghezza compresa tra 3 e 90 caratteri' };
  }

  // Reject <script> tags
  if (/<\s*\/?\s*script/i.test(trimmedSecret)) {
    return { valid: false, error: 'Il segreto contiene tag non consentiti (<script>)' };
  }

  // Reject URLs http/https
  if (/https?:/i.test(trimmedSecret) || /www\.[a-z0-9\-]+(?:\.[a-z]{2,})/i.test(trimmedSecret)) {
    return { valid: false, error: 'Il segreto non può contenere URL o link http/https' };
  }

  // Reject phone numbers (international prefix, delimited numbers, or standard mobile/landline formats)
  const isPhone = (
    /(?:\+|00)\d{1,4}[\s./-]?\(?\d{1,4}\)?(?:[\s./-]?\d{2,5}){2,4}/.test(trimmedSecret) ||
    /(?:\b|\()(?:\d{2,4}[\s./-]|\(\d{2,4}\)[\s.-]?)\d{3,4}[\s./-]?\d{3,7}\b/.test(trimmedSecret) ||
    /\b(?:\d{3}[-.\s]?\d{3}[-.\s]?\d{4}|\d{7,11})\b/.test(trimmedSecret)
  );
  if (isPhone) {
    return { valid: false, error: 'Il segreto non può contenere numeri di telefono' };
  }

  return {
    valid: true,
    data: {
      gender,
      targetGender,
      mood: DOMSafetyFilter.sanitize(mood),
      secret: DOMSafetyFilter.sanitize(trimmedSecret)
    }
  };
}

function validateMessagePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return { valid: false, error: 'Payload must be a valid JSON object' };
  }
  const { roomId, message } = payload;
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: 'Invalid or missing roomId' };
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0 || message.length > 500) {
    return { valid: false, error: 'Message must be a non-empty string of max 500 characters' };
  }
  return { valid: true, data: { roomId, message: DOMSafetyFilter.sanitize(message) } };
}

// IP Extraction helper
function getClientIp(socket) {
  const cf = socket.handshake.headers['cf-connecting-ip'];
  if (cf) return cf.trim();
  const forwarded = socket.handshake.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return socket.handshake.address || socket.conn.remoteAddress || '127.0.0.1';
}

// IP Jail helper
function isIpJailed(ip) {
  if (!ip || !ipJail.has(ip)) return false;
  const unjailAt = ipJail.get(ip);
  if (Date.now() < unjailAt) {
    return true;
  }
  ipJail.delete(ip);
  reportCounts.delete(ip);
  return false;
}

// Rate limiter & IP Jail helper
function checkRateLimit(socket) {
  const socketId = socket.id;
  const ip = getClientIp(socket);
  const now = Date.now();

  if (isIpJailed(ip)) {
    return false;
  }

  const limitData = rateLimits.get(socketId) || { count: 0, resetTime: now + 1000 };

  if (now > limitData.resetTime) {
    limitData.count = 1;
    limitData.resetTime = now + 1000;
    rateLimits.set(socketId, limitData);
    return true;
  }

  limitData.count++;
  rateLimits.set(socketId, limitData);

  if (limitData.count > RATE_LIMIT_MAX_PER_SEC) {
    // Jail IP for flooding
    ipJail.set(ip, now + DEFAULT_JAIL_TIME_MS);
    return false;
  }

  return true;
}

// ==========================================
// URBAN MONIKER ROTATION ENGINE
// ==========================================
const MONIKERS = [
  'Shadow', 'Neon', 'Viper', 'Ghost', 'Chrome', 'Cipher', 
  'Raven', 'Drifter', 'Phantom', 'Hacker', 'Rebel', 'Rogue', 
  'Blade', 'Voltage', 'Echo', 'Specter', 'Zero', 'Apex'
];

function generateMoniker() {
  const name = MONIKERS[Math.floor(Math.random() * MONIKERS.length)];
  const num = Math.floor(10 + Math.random() * 89);
  return `${name}_${num}`;
}

// ==========================================
// MATCHMAKING & PAIRING ENGINE (RAM FIFO)
// ==========================================
function getMoodQueue(mood) {
  const key = (mood || '').trim().toLowerCase();
  if (!queues[key]) {
    queues[key] = [];
  }
  return queues[key];
}

function findMatch(newCandidate) {
  const moodQueue = getMoodQueue(newCandidate.mood);

  for (let i = 0; i < moodQueue.length; i++) {
    const waiter = moodQueue[i];

    // Ensure not self
    if (waiter.socketId === newCandidate.socketId) continue;

    // Prune stale / disconnected socket from memory queue
    if (io && io.sockets && io.sockets.sockets && !io.sockets.sockets.has(waiter.socketId)) {
      moodQueue.splice(i, 1);
      i--;
      continue;
    }

    // Gender compatibility:
    // candidate matches waiter's target AND waiter matches candidate's target
    const candMatchesWaiter = waiter.targetGender === 'Tutti' || waiter.targetGender === newCandidate.gender;
    const waiterMatchesCand = newCandidate.targetGender === 'Tutti' || newCandidate.targetGender === waiter.gender;

    if (candMatchesWaiter && waiterMatchesCand) {
      // Remove waiter from mood FIFO queue
      moodQueue.splice(i, 1);
      return waiter;
    }
  }

  return null;
}

function removeFromQueue(socketId) {
  let removed = false;
  for (const key of Object.keys(queues)) {
    const q = queues[key];
    const index = q.findIndex(item => item.socketId === socketId);
    if (index !== -1) {
      q.splice(index, 1);
      removed = true;
    }
    if (q.length === 0 && !['cazzeggio', 'sfogati', 'flirt'].includes(key)) {
      delete queues[key];
    }
  }
  return removed;
}

// ==========================================
// ROOM LIFECYCLE & TIMER MANAGEMENT
// ==========================================
const MATCH_INITIAL_TIMER_SEC = 180; // 3 minutes
const EXTENSION_TIME_SEC = 300;       // +5 minutes

function createRoom(userA, userB) {
  const sockA = io.sockets.sockets.get(userA.socketId);
  const sockB = io.sockets.sockets.get(userB.socketId);

  // If one socket disconnected right before creation, avoid zombie rooms
  if (!sockA && sockB) {
    const bQueue = getMoodQueue(userB.mood);
    bQueue.unshift(userB);
    return null;
  }
  if (!sockB && sockA) {
    const aQueue = getMoodQueue(userA.mood);
    aQueue.unshift(userA);
    return null;
  }
  if (!sockA && !sockB) {
    return null;
  }

  const roomId = 'street_' + crypto.randomUUID().substring(0, 8);

  const room = {
    id: roomId,
    user1: userA.socketId,
    user2: userB.socketId,
    ip1: userA.ip,
    ip2: userB.ip,
    secret1: userA.secret,
    secret2: userB.secret,
    mood: userA.mood,
    createdAt: Date.now(),
    timeRemaining: MATCH_INITIAL_TIMER_SEC,
    timerInterval: null,
    extensions: new Set()
  };

  rooms.set(roomId, room);

  // Update user records
  const userARecord = users.get(userA.socketId);
  if (userARecord) userARecord.roomId = roomId;

  const userBRecord = users.get(userB.socketId);
  if (userBRecord) userBRecord.roomId = roomId;

  // Join socket rooms
  if (sockA) sockA.join(roomId);
  if (sockB) sockB.join(roomId);

  // Start 1-second countdown timer
  room.timerInterval = setInterval(() => {
    room.timeRemaining--;

    // Sync time or alert when expiring
    if (room.timeRemaining === 60 || room.timeRemaining === 30 || room.timeRemaining === 10) {
      io.to(roomId).emit('timer_warning', { timeRemaining: room.timeRemaining });
    }

    if (room.timeRemaining <= 0) {
      io.to(roomId).emit('chat_ended', { reason: 'time_expired' });
      destroyRoom(roomId, 'time_expired');
    }
  }, 1000);

  // Assign distinct urban street pseudonyms
  const nickA = generateMoniker();
  let nickB = generateMoniker();
  while (nickB === nickA) {
    nickB = generateMoniker();
  }

  // Swap secrets securely!
  // User A receives User B's secret
  if (sockA) {
    sockA.emit('match_found', {
      roomId,
      partnerMood: userB.mood,
      partnerGender: userB.gender,
      partnerSecret: userB.secret,
      partnerMoniker: nickB,
      myMoniker: nickA,
      partnerNick: nickB,
      myNick: nickA,
      timeRemaining: room.timeRemaining,
      createdAt: room.createdAt
    });
  }

  // User B receives User A's secret
  if (sockB) {
    sockB.emit('match_found', {
      roomId,
      partnerMood: userA.mood,
      partnerGender: userA.gender,
      partnerSecret: userA.secret,
      partnerMoniker: nickA,
      myMoniker: nickB,
      partnerNick: nickA,
      myNick: nickB,
      timeRemaining: room.timeRemaining,
      createdAt: room.createdAt
    });
  }

  return room;
}

// ==========================================
// SKILL: VolatileMemoryLeakAuditor (100% Cleanup)
// ==========================================
function destroyRoom(roomId, reason = 'terminated') {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }

  const sock1 = io.sockets.sockets.get(room.user1);
  const sock2 = io.sockets.sockets.get(room.user2);

  if (sock1) {
    sock1.leave(roomId);
  }
  const u1 = users.get(room.user1);
  if (u1 && u1.roomId === roomId) u1.roomId = null;

  if (sock2) {
    sock2.leave(roomId);
  }
  const u2 = users.get(room.user2);
  if (u2 && u2.roomId === roomId) u2.roomId = null;

  room.extensions.clear();
  rooms.delete(roomId);
}

function handleUserDisconnectOrSkip(socketId, action = 'disconnect') {
  removeFromQueue(socketId);
  rateLimits.delete(socketId);

  const user = users.get(socketId);
  if (!user) return;

  if (user.roomId) {
    const roomId = user.roomId;
    const room = rooms.get(roomId);

    if (room) {
      const partnerId = room.user1 === socketId ? room.user2 : room.user1;
      const partnerSocket = io.sockets.sockets.get(partnerId);

      if (partnerSocket) {
        partnerSocket.emit('partner_skipped', {
          reason: action === 'skip' ? 'Il partner ha saltato la conversazione.' : 'Il partner si è disconnesso.'
        });
      }

      destroyRoom(roomId, action);
    }
  }

  if (action === 'disconnect') {
    users.delete(socketId);
  }
}

// ==========================================
// SOCKET.IO EVENT HANDLERS
// ==========================================
io.on('connection', (socket) => {
  const clientIp = getClientIp(socket);

  // Check IP Jail
  if (isIpJailed(clientIp)) {
    socket.emit('error_event', { code: 'IP_JAILED', message: 'Indirizzo IP temporaneamente sospeso.' });
    socket.disconnect(true);
    return;
  }

  // Initialize user record in volatile RAM
  users.set(socket.id, {
    socketId: socket.id,
    ip: clientIp,
    gender: null,
    targetGender: null,
    mood: null,
    secret: null,
    roomId: null,
    joinedQueueAt: null
  });

  // Emit current stats
  socket.emit('online_stats', {
    onlineCount: simulatedBaseOnline + users.size,
    inQueue: queue.length,
    activeChats: rooms.size
  });

  // 1. JOIN QUEUE
  socket.on('join_queue', (payload) => {
    if (isIpJailed(clientIp)) {
      socket.emit('error_event', { code: 'IP_JAILED', message: 'Indirizzo IP temporaneamente sospeso.' });
      socket.disconnect(true);
      return;
    }

    if (!checkRateLimit(socket)) {
      return socket.emit('error_event', { code: 'RATE_LIMIT', message: 'Troppe richieste. Rallenta.' });
    }

    const validation = validateJoinPayload(payload);
    if (!validation.valid) {
      return socket.emit('error_event', { code: 'INVALID_PAYLOAD', message: validation.error });
    }

    // Clean up previous room if any
    const user = users.get(socket.id);
    if (user && user.roomId) {
      handleUserDisconnectOrSkip(socket.id, 'skip');
    }

    removeFromQueue(socket.id);

    const { gender, targetGender, mood, secret } = validation.data;
    user.gender = gender;
    user.targetGender = targetGender;
    user.mood = mood;
    user.secret = secret;
    user.joinedQueueAt = Date.now();

    const candidate = {
      socketId: socket.id,
      ip: clientIp,
      gender,
      targetGender,
      mood,
      secret,
      joinedAt: Date.now()
    };

    const match = findMatch(candidate);

    if (match) {
      createRoom(match, candidate);
    } else {
      const moodQueue = getMoodQueue(candidate.mood);
      moodQueue.push(candidate);
      socket.emit('queue_joined', {
        position: moodQueue.length,
        mood,
        onlineCount: simulatedBaseOnline + users.size
      });
    }

    io.emit('online_stats', {
      onlineCount: simulatedBaseOnline + users.size,
      inQueue: queue.length,
      activeChats: rooms.size
    });
  });

  // 2. LEAVE QUEUE
  socket.on('leave_queue', () => {
    removeFromQueue(socket.id);
    socket.emit('queue_left', { success: true });
    io.emit('online_stats', {
      onlineCount: simulatedBaseOnline + users.size,
      inQueue: queue.length,
      activeChats: rooms.size
    });
  });

  // 3. SEND MESSAGE
  socket.on('send_message', (payload) => {
    if (isIpJailed(clientIp)) {
      socket.emit('error_event', { code: 'IP_JAILED', message: 'Indirizzo IP temporaneamente sospeso.' });
      socket.disconnect(true);
      return;
    }

    if (!checkRateLimit(socket)) {
      return socket.emit('error_event', { code: 'RATE_LIMIT', message: 'Stai inviando messaggi troppo velocemente.' });
    }

    const validation = validateMessagePayload(payload);
    if (!validation.valid) {
      return socket.emit('error_event', { code: 'INVALID_MESSAGE', message: validation.error });
    }

    const { roomId, message } = validation.data;
    const user = users.get(socket.id);

    if (!user || user.roomId !== roomId) {
      return socket.emit('error_event', { code: 'UNAUTHORIZED', message: 'Non appartieni a questa stanza.' });
    }

    const room = rooms.get(roomId);
    if (!room) {
      return socket.emit('error_event', { code: 'ROOM_NOT_FOUND', message: 'Stanza inesistente o chiusa.' });
    }

    const messageEvent = {
      id: 'msg_' + crypto.randomUUID().substring(0, 8),
      senderId: socket.id,
      message,
      timestamp: Date.now()
    };

    io.to(roomId).emit('receive_message', messageEvent);
  });

  // 4. TYPING INDICATOR
  socket.on('typing', (payload) => {
    if (!payload || !payload.roomId) return;
    const user = users.get(socket.id);
    if (user && user.roomId === payload.roomId) {
      socket.to(payload.roomId).emit('partner_typing', { isTyping: !!payload.isTyping });
    }
  });

  // 5. EXTENSION REQUEST (Supports both request_extend and request_extension)
  const handleExtensionRequest = (payload) => {
    if (!payload || !payload.roomId) return;
    const user = users.get(socket.id);
    if (!user || user.roomId !== payload.roomId) return;

    const room = rooms.get(payload.roomId);
    if (!room) return;

    room.extensions.add(socket.id);

    if (room.extensions.size >= 2) {
      room.timeRemaining += EXTENSION_TIME_SEC;
      room.extensions.clear();
      io.to(room.id).emit('extension_granted', {
        newTimeRemaining: room.timeRemaining,
        addedSeconds: EXTENSION_TIME_SEC
      });
    } else {
      socket.to(room.id).emit('extension_requested', {
        by: socket.id
      });
    }
  };

  socket.on('request_extension', handleExtensionRequest);
  socket.on('request_extend', handleExtensionRequest);

  // 6. SKIP PARTNER
  socket.on('skip_partner', () => {
    handleUserDisconnectOrSkip(socket.id, 'skip');
    socket.emit('skipped_confirmed', { success: true });
    io.emit('online_stats', {
      onlineCount: simulatedBaseOnline + users.size,
      inQueue: queue.length,
      activeChats: rooms.size
    });
  });

  // 7. REALTIME REACTION (EMOJI BURST)
  socket.on('send_reaction', (payload) => {
    if (!checkRateLimit(socket)) return;
    if (!payload || !payload.roomId || !payload.emoji) return;
    const user = users.get(socket.id);
    if (!user || user.roomId !== payload.roomId) return;
    const allowedEmojis = ['🔥', '💀', '⚡', '🖤', '🚬', '👀', '🤯', '👏'];
    if (!allowedEmojis.includes(payload.emoji)) return;

    io.to(payload.roomId).emit('receive_reaction', {
      senderId: socket.id,
      emoji: payload.emoji
    });
  });

  // 8. REPORT USER & TEMPORARY IP JAIL
  socket.on('report_user', (payload) => {
    if (!payload || !payload.roomId) return;
    const user = users.get(socket.id);
    if (!user || user.roomId !== payload.roomId) return;

    const room = rooms.get(payload.roomId);
    if (room) {
      const partnerId = room.user1 === socket.id ? room.user2 : room.user1;
      const partnerSocket = io.sockets.sockets.get(partnerId);

      // Jail partner's IP for 10 minutes in volatile RAM
      const partnerIp = room.user1 === socket.id ? room.ip2 : room.ip1;
      if (partnerIp) {
        const count = (reportCounts.get(partnerIp) || 0) + 1;
        reportCounts.set(partnerIp, count);
        ipJail.set(partnerIp, Date.now() + DEFAULT_JAIL_TIME_MS);
      }

      if (partnerSocket) {
        partnerSocket.emit('partner_skipped', { 
          reason: 'La chat è stata chiusa a seguito di una segnalazione di sicurezza.' 
        });
      }

      destroyRoom(room.id, 'reported');
    }

    socket.emit('report_confirmed', { 
      success: true, 
      message: 'Utente segnalato e bloccato. Stanza chiusa all\'istante.' 
    });

    io.emit('online_stats', {
      onlineCount: simulatedBaseOnline + users.size,
      inQueue: queue.length,
      activeChats: rooms.size
    });
  });

  // 9. LATENCY PING CHECK
  socket.on('ping_check', (clientTimestamp, callback) => {
    if (typeof callback === 'function') {
      callback({ clientTimestamp, serverTimestamp: Date.now() });
    }
  });

  // 10. DISCONNECT
  socket.on('disconnect', () => {
    handleUserDisconnectOrSkip(socket.id, 'disconnect');
    io.emit('online_stats', {
      onlineCount: simulatedBaseOnline + users.size,
      inQueue: queue.length,
      activeChats: rooms.size
    });
  });
});

// ==========================================
// REST ENDPOINTS
// ==========================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now()
  });
});

app.get('/api/stats', (req, res) => {
  const mem = process.memoryUsage();
  res.json({
    usersCount: users.size,
    roomsCount: rooms.size,
    queueCount: queue.length,
    rateLimitsCount: rateLimits.size,
    jailedIpsCount: ipJail.size,
    reportCountsCount: reportCounts.size,
    memory: {
      rssMb: +(mem.rss / (1024 * 1024)).toFixed(2),
      heapTotalMb: +(mem.heapTotal / (1024 * 1024)).toFixed(2),
      heapUsedMb: +(mem.heapUsed / (1024 * 1024)).toFixed(2)
    }
  });
});

// Export app and server for testing & running
const PORT = process.env.PORT || 3000;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`[STREETALK] Server online on http://localhost:${PORT}`);
    console.log(`[STREETALK] Mode: Zero-DB Volatile RAM Engine`);
  });
}

module.exports = { 
  app, 
  server, 
  io, 
  users, 
  queues,
  queue, 
  rooms, 
  rateLimits, 
  ipJail, 
  reportCounts,
  validateJoinPayload, 
  validateMessagePayload, 
  DOMSafetyFilter 
};
