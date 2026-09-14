const fs = require('fs');

const html = fs.readFileSync('d:/streetalk/index.html', 'utf8');

console.log('=== VERIFYING R3 DOM ELEMENT EXISTENCE IN HTML ===');

const appIds = [
  'chat-partner-motto',
  'chat-partner-topics',
  'chat-partner-avoids',
  'friend-unlocked-drawer',
  'friend-partner-social-box',
  'friend-social-handle-input',
  'friend-partner-social-handle'
];

appIds.forEach(id => {
  const exists = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log(`id="${id}" queried by app.js:`, exists ? 'EXISTS' : 'MISSING IN HTML (DEFECT)');
});

console.log('\n=== CHECKING WHAT HTML ACTUALLY CONTAINS ===');
const actualIds = [
  'chat-partner-motto-row',
  'chat-partner-motto-text',
  'chat-partner-topics-row',
  'chat-partner-topics-text',
  'chat-partner-avoids-row',
  'chat-partner-avoids-text',
  'friend-request-unlocked-drawer',
  'friend-social-handle',
  'friend-partner-social-received',
  'friend-partner-social-text'
];

actualIds.forEach(id => {
  const exists = html.includes(`id="${id}"`) || html.includes(`id='${id}'`);
  console.log(`id="${id}" present in index.html:`, exists ? 'YES' : 'NO');
});
