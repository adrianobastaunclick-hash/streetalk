const fs = require('fs');

const app = fs.readFileSync('d:/streetalk/frontend/app.js', 'utf8');
const html = fs.readFileSync('d:/streetalk/index.html', 'utf8');

const missingList = [
  'chat-partner-motto',
  'chat-partner-topics',
  'chat-partner-avoids',
  'friend-unlocked-drawer',
  'friend-partner-social-box',
  'friend-social-handle-input',
  'friend-partner-social-handle',
  'group-create-title',
  'group-create-desc',
  'group-create-category',
  'btn-checkout-founder'
];

console.log('=== APP.JS USAGE ANALYSIS ===');
missingList.forEach(id => {
  const lines = app.split('\n');
  const matchedLines = [];
  lines.forEach((l, idx) => {
    if (l.includes(id)) {
      matchedLines.push(`${idx + 1}: ${l.trim()}`);
    }
  });
  console.log(`\nID: "${id}" (used in app.js):`);
  matchedLines.forEach(ml => console.log('  ' + ml));
});
