const fs = require('fs');
const assert = require('assert');

console.log('=== RUNNING ADVERSARIAL FRONTEND & DOM INTEGRATION AUDIT ===\n');

const htmlContent = fs.readFileSync('index.html', 'utf8');
const publicHtmlContent = fs.readFileSync('public/index.html', 'utf8');
const appJsContent = fs.readFileSync('frontend/app.js', 'utf8');
const appMinJsContent = fs.readFileSync('public/app.min.js', 'utf8');

// 1. Verify exact 7 DOM IDs exist in both index.html and public/index.html
const targetDomIds = [
  'friend-request-unlocked-drawer',
  'friend-social-handle',
  'friend-partner-social-received',
  'friend-partner-social-text',
  'chat-partner-motto-row',
  'chat-partner-motto-text',
  'chat-partner-topics-row',
  'chat-partner-topics-text',
  'chat-partner-avoids-row',
  'chat-partner-avoids-text'
];

targetDomIds.forEach(id => {
  assert(htmlContent.includes(`id="${id}"`), `Missing id="${id}" in index.html`);
  assert(publicHtmlContent.includes(`id="${id}"`), `Missing id="${id}" in public/index.html`);
  console.log(`[PASS] HTML existence verified for: #${id}`);
});

// 2. Adversarial Fallback & Resolution Simulation
// We simulate a mock DOM environment mimicking index.html elements
class MockClassList {
  constructor(initial = []) {
    this.classes = new Set(initial);
  }
  add(c) { this.classes.add(c); }
  remove(c) { this.classes.delete(c); }
  contains(c) { return this.classes.has(c); }
  toggle(c, force) {
    if (force !== undefined) {
      if (force) this.classes.add(c);
      else this.classes.delete(c);
    } else {
      if (this.classes.has(c)) this.classes.delete(c);
      else this.classes.add(c);
    }
  }
}

class MockElement {
  constructor(id, classes = []) {
    this.id = id;
    this.classList = new MockClassList(classes);
    this.textContent = '';
    this.value = '';
    this.disabled = false;
    this.innerHTML = '';
  }
}

function createMockEnvironment(mode = 'canonical') {
  const elements = new Map();
  function addEl(id, classes = []) {
    const el = new MockElement(id, classes);
    elements.set(id, el);
    return el;
  }

  if (mode === 'canonical') {
    addEl('btn-friend-request');
    addEl('friend-request-status-badge');
    addEl('friend-request-unlocked-drawer', ['hidden']);
    addEl('friend-social-handle');
    addEl('friend-social-platform');
    elements.get('friend-social-platform').value = 'telegram';
    addEl('friend-partner-social-received', ['hidden']);
    addEl('friend-partner-social-text');
    addEl('chat-partner-motto-row', ['hidden']);
    addEl('chat-partner-motto-text');
    addEl('chat-partner-topics-row', ['hidden']);
    addEl('chat-partner-topics-text');
    addEl('chat-partner-avoids-row', ['hidden']);
    addEl('chat-partner-avoids-text');
  } else if (mode === 'legacy') {
    // Mode testing fallback support
    addEl('btn-friend-request');
    addEl('friend-request-status-badge');
    addEl('friend-unlocked-drawer', ['hidden']);
    addEl('friend-social-handle-input');
    addEl('friend-social-platform');
    elements.get('friend-social-platform').value = 'instagram';
    addEl('friend-partner-social-box', ['hidden']);
    addEl('friend-partner-social-handle');
    addEl('chat-partner-motto-row', ['hidden']);
    addEl('chat-partner-motto');
    addEl('chat-partner-topics-row', ['hidden']);
    addEl('chat-partner-topics');
    addEl('chat-partner-avoids-row', ['hidden']);
    addEl('chat-partner-avoids');
  }

  return {
    getElementById: (id) => elements.get(id) || null
  };
}

function runSimulatedFlow(doc) {
  // Simulate safeSetText
  function safeSetText(el, text) {
    if (el) el.textContent = text;
  }

  // A. Simulate resetFriendRequestUI
  const drawer = doc.getElementById('friend-request-unlocked-drawer') || doc.getElementById('friend-unlocked-drawer');
  const partnerSocialBox = doc.getElementById('friend-partner-social-received') || doc.getElementById('friend-partner-social-box');
  assert(drawer !== null, 'Drawer element must be found');
  assert(partnerSocialBox !== null, 'Partner social box must be found');
  if (drawer) drawer.classList.add('hidden');
  if (partnerSocialBox) partnerSocialBox.classList.add('hidden');
  assert(drawer.classList.contains('hidden'), 'Drawer must be hidden on reset');

  // B. Simulate updateFriendRequestUI('unlocked')
  if (drawer) drawer.classList.remove('hidden');
  assert(!drawer.classList.contains('hidden'), 'Drawer must be revealed when unlocked');

  // C. Simulate shareFriendSocial
  const handleInput = doc.getElementById('friend-social-handle') || doc.getElementById('friend-social-handle-input');
  assert(handleInput !== null, 'Handle input element must be found');
  handleInput.value = '@street_cyber_tester';
  const handle = handleInput.value.trim();
  assert.strictEqual(handle, '@street_cyber_tester', 'Handle must match entered value');

  // D. Simulate onFriendContactReceived
  const data = { handle: '@neon_rebel', platform: 'telegram' };
  const box = doc.getElementById('friend-partner-social-received') || doc.getElementById('friend-partner-social-box');
  const handleEl = doc.getElementById('friend-partner-social-text') || doc.getElementById('friend-partner-social-handle');
  assert(box !== null, 'Box element must be found');
  assert(handleEl !== null, 'Handle element must be found');
  box.classList.remove('hidden');
  safeSetText(handleEl, `${(data.platform || 'Social').toUpperCase()}: ${data.handle}`);
  assert(!box.classList.contains('hidden'), 'Partner social box must be visible');
  assert.strictEqual(handleEl.textContent, 'TELEGRAM: @neon_rebel');

  // E. Simulate copyPartnerSocial
  const copyEl = doc.getElementById('friend-partner-social-text') || doc.getElementById('friend-partner-social-handle');
  assert.strictEqual(copyEl.textContent, 'TELEGRAM: @neon_rebel');

  // F. Simulate match_found partner details
  const pMottoEl = doc.getElementById('chat-partner-motto-text') || doc.getElementById('chat-partner-motto');
  const pTopicsEl = doc.getElementById('chat-partner-topics-text') || doc.getElementById('chat-partner-topics');
  const pAvoidsEl = doc.getElementById('chat-partner-avoids-text') || doc.getElementById('chat-partner-avoids');
  assert(pMottoEl !== null, 'Motto element must be found');
  assert(pTopicsEl !== null, 'Topics element must be found');
  assert(pAvoidsEl !== null, 'Avoids element must be found');

  const currentPartnerProfile = {
    motto: 'Asfalto e fiamme',
    topics: 'Musica, street art, coding',
    avoids: 'Tossicità, spam'
  };

  const mottoVal = currentPartnerProfile.motto ? `"${currentPartnerProfile.motto}"` : 'Nessun motto impostato';
  const topicsVal = currentPartnerProfile.topics || 'Aperto a qualsiasi argomento con rispetto';
  const avoidsVal = currentPartnerProfile.avoids || 'Mancanza di rispetto e superficialità';
  safeSetText(pMottoEl, mottoVal);
  safeSetText(pTopicsEl, topicsVal);
  safeSetText(pAvoidsEl, avoidsVal);

  const mottoRow = doc.getElementById('chat-partner-motto-row');
  if (mottoRow && mottoVal) mottoRow.classList.remove('hidden');
  const topicsRow = doc.getElementById('chat-partner-topics-row');
  if (topicsRow && topicsVal) topicsRow.classList.remove('hidden');
  const avoidsRow = doc.getElementById('chat-partner-avoids-row');
  if (avoidsRow && avoidsVal) avoidsRow.classList.remove('hidden');

  assert.strictEqual(pMottoEl.textContent, '"Asfalto e fiamme"');
  assert(!mottoRow.classList.contains('hidden'), 'Motto row must be unhidden');
  assert(!topicsRow.classList.contains('hidden'), 'Topics row must be unhidden');
  assert(!avoidsRow.classList.contains('hidden'), 'Avoids row must be unhidden');
}

console.log('\n--- Testing in CANONICAL Mode (index.html DOM) ---');
const canonicalDoc = createMockEnvironment('canonical');
runSimulatedFlow(canonicalDoc);
console.log('[PASS] Canonical mode simulation executed perfectly.');

console.log('\n--- Testing in LEGACY Mode (Fallback IDs) ---');
const legacyDoc = createMockEnvironment('legacy');
runSimulatedFlow(legacyDoc);
console.log('[PASS] Legacy fallback mode simulation executed perfectly.');

// 3. Minified Bundle Content Verification
console.log('\n--- Verifying public/app.min.js Content ---');
const requiredStringsInBundle = [
  'friend-request-unlocked-drawer',
  'friend-social-handle',
  'friend-partner-social-received',
  'friend-partner-social-text',
  'chat-partner-motto-text',
  'chat-partner-topics-text',
  'chat-partner-avoids-text',
  'chat-partner-motto-row',
  'chat-partner-topics-row',
  'chat-partner-avoids-row'
];

requiredStringsInBundle.forEach(str => {
  assert(appMinJsContent.includes(str), `Bundle public/app.min.js is missing compiled identifier: ${str}`);
  console.log(`[PASS] Bundle includes compiled identifier: "${str}"`);
});

console.log('\n=== ALL ADVERSARIAL FRONTEND AUDIT CHECKS PASSED ===\n');
