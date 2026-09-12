const fs=require('fs');let html=fs.readFileSync('public/index.html','utf8');
// The retired background and tilt engines are unused by the active CSS 3D identity.
html=html.replace(/  <script>\s*\(function init3DWebGLBackground\(\) \{[\s\S]*?<\/script>/,'');
html=html.replace(/  <script>\s*\(function init3DTiltAndGSAP\(\) \{[\s\S]*?<\/script>/,'');
let scripts=[];html=html.replace(/  <script>\s*([\s\S]*?)<\/script>/g,(_,code)=>{scripts.push(code);return '';});
fs.mkdirSync('frontend',{recursive:true});fs.writeFileSync('frontend/app.js',scripts.join('\n'));
html=html.replace('<script src="/vendor/socket.io.min.js"></script>','<script src="/vendor/socket.io.min.js" defer></script>\n  <script src="/app.min.js" defer></script>');
html=html.replace('aria-label="Torna alla Home di STREETALK"','aria-label="ST STREETALK — torna alla home"');
html=html.replace('</head>','  <link rel="icon" href="/favicon.svg" type="image/svg+xml">\n</head>');
fs.writeFileSync('public/index.html',html);fs.writeFileSync('index.html',html);
fs.writeFileSync('public/favicon.svg','<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#b72e55"/><text x="32" y="43" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="700" fill="#fffefa">ST</text></svg>');
const css=`
[data-design="incrocio"] #hero-tag { color: #a52249 !important; }
[data-design="incrocio"] .text-teal-400 { color: #17675a !important; }
[data-design="incrocio"] .text-rose-400 { color: #a51d39 !important; }
[data-design="incrocio"] .bg-street-surface { background: var(--inc-panel, #fffefa) !important; }
`;
for(const p of ['incrocio.css','public/incrocio.css']) fs.appendFileSync(p,css);
let test=fs.readFileSync('tests/autonomous-suite.js','utf8');test=test.replace("const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');","const indexHtml = fs.readFileSync(path.join(__dirname, '../public/index.html'), 'utf8') + '\\n' + fs.readFileSync(path.join(__dirname, '../frontend/app.js'), 'utf8');");fs.writeFileSync('tests/autonomous-suite.js',test);
let config=fs.readFileSync('tailwind.config.cjs','utf8').replace("content: ['./public/index.html']","content: ['./public/index.html', './frontend/app.js']");fs.writeFileSync('tailwind.config.cjs',config);
