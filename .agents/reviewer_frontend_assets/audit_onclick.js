const fs = require('fs');

const app = fs.readFileSync('d:/streetalk/frontend/app.js', 'utf8');
const html = fs.readFileSync('d:/streetalk/index.html', 'utf8');

const onclickRegex = /on[a-z]+\s*=\s*["']([^"']+)["']/gi;
let m;
const handlers = new Set();
while ((m = onclickRegex.exec(html)) !== null) {
  const code = m[1].trim();
  // Extract function call name
  const fnMatch = code.match(/^([a-zA-Z0-9_$]+)\s*\(/);
  if (fnMatch) {
    handlers.add(fnMatch[1]);
  }
}

console.log('Total inline event handler functions:', handlers.size);
const missingHandlers = [];
for (const fn of handlers) {
  const inWindow = app.includes(`window.${fn}`) || app.includes(`window['${fn}']`) || app.includes(`window["${fn}"]`);
  const isGlobalFn = new RegExp(`function\\s+${fn}\\s*\\(`).test(app);
  if (!inWindow && !isGlobalFn) {
    missingHandlers.push(fn);
  }
}

console.log('Missing/unbound handlers:', missingHandlers);
handlers.forEach(h => {
  const exposed = app.includes(`window.${h}`) || new RegExp(`function\\s+${h}\\s*\\(`).test(app);
  console.log(`Handler: ${h} -> ${exposed ? 'EXPOSED' : 'MISSING'}`);
});
