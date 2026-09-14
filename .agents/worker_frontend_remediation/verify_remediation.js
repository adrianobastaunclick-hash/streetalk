const fs = require('fs');

console.log('=== VERIFYING FRONTEND REMEDIATION IN APP.JS AND HTML ===\n');

const html = fs.readFileSync('index.html', 'utf8');
const publicHtml = fs.readFileSync('public/index.html', 'utf8');
const appJs = fs.readFileSync('frontend/app.js', 'utf8');
const appMinJs = fs.readFileSync('public/app.min.js', 'utf8');

const checks = [
  {
    name: 'R3 Friend Request Drawer: friend-request-unlocked-drawer in HTML & app.js',
    id: 'friend-request-unlocked-drawer',
    test: () => {
      const inHtml = html.includes('id="friend-request-unlocked-drawer"');
      const inPublicHtml = publicHtml.includes('id="friend-request-unlocked-drawer"');
      const inApp = appJs.includes("document.getElementById('friend-request-unlocked-drawer')");
      const inBundle = appMinJs.includes("friend-request-unlocked-drawer");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Friend Social Handle Input: friend-social-handle in HTML & app.js',
    id: 'friend-social-handle',
    test: () => {
      const inHtml = html.includes('id="friend-social-handle"');
      const inPublicHtml = publicHtml.includes('id="friend-social-handle"');
      const inApp = appJs.includes("document.getElementById('friend-social-handle')");
      const inBundle = appMinJs.includes("friend-social-handle");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Friend Partner Social Box: friend-partner-social-received in HTML & app.js',
    id: 'friend-partner-social-received',
    test: () => {
      const inHtml = html.includes('id="friend-partner-social-received"');
      const inPublicHtml = publicHtml.includes('id="friend-partner-social-received"');
      const inApp = appJs.includes("document.getElementById('friend-partner-social-received')");
      const inBundle = appMinJs.includes("friend-partner-social-received");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Friend Partner Social Text: friend-partner-social-text in HTML & app.js',
    id: 'friend-partner-social-text',
    test: () => {
      const inHtml = html.includes('id="friend-partner-social-text"');
      const inPublicHtml = publicHtml.includes('id="friend-partner-social-text"');
      const inApp = appJs.includes("document.getElementById('friend-partner-social-text')");
      const inBundle = appMinJs.includes("friend-partner-social-text");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Partner Motto Text: chat-partner-motto-text in HTML & app.js',
    id: 'chat-partner-motto-text',
    test: () => {
      const inHtml = html.includes('id="chat-partner-motto-text"');
      const inPublicHtml = publicHtml.includes('id="chat-partner-motto-text"');
      const inApp = appJs.includes("document.getElementById('chat-partner-motto-text')");
      const inBundle = appMinJs.includes("chat-partner-motto-text");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Partner Topics Text: chat-partner-topics-text in HTML & app.js',
    id: 'chat-partner-topics-text',
    test: () => {
      const inHtml = html.includes('id="chat-partner-topics-text"');
      const inPublicHtml = publicHtml.includes('id="chat-partner-topics-text"');
      const inApp = appJs.includes("document.getElementById('chat-partner-topics-text')");
      const inBundle = appMinJs.includes("chat-partner-topics-text");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Partner Avoids Text: chat-partner-avoids-text in HTML & app.js',
    id: 'chat-partner-avoids-text',
    test: () => {
      const inHtml = html.includes('id="chat-partner-avoids-text"');
      const inPublicHtml = publicHtml.includes('id="chat-partner-avoids-text"');
      const inApp = appJs.includes("document.getElementById('chat-partner-avoids-text')");
      const inBundle = appMinJs.includes("chat-partner-avoids-text");
      return inHtml && inPublicHtml && inApp && inBundle;
    }
  },
  {
    name: 'R3 Row Unhiding: mottoRow, topicsRow, avoidsRow unhidden when populated',
    id: 'row-unhiding',
    test: () => {
      const previewUnhide = appJs.includes("mottoRow && previewMotto") &&
                            appJs.includes("topicsRow && previewTopics") &&
                            appJs.includes("avoidsRow && previewAvoids");
      const matchUnhide = appJs.includes("mottoRow && mottoVal") &&
                          appJs.includes("topicsRow && topicsVal") &&
                          appJs.includes("avoidsRow && avoidsVal");
      return previewUnhide && matchUnhide;
    }
  }
];

let failed = 0;
checks.forEach(c => {
  const ok = c.test();
  console.log(`[${ok ? 'PASS' : 'FAIL'}] ${c.name}`);
  if (!ok) failed++;
});

console.log(`\nRemediation Verification: ${checks.length - failed}/${checks.length} checks passed.`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL REMEDIATION CHECKS PASSED PERFECTLY!\n');
}
