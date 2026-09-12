const fs=require('fs');
(async()=>{
let css=fs.readFileSync('outputs/font-source.css','utf8');
const urls=[...new Set([...css.matchAll(/https:[^)]+/g)].map(m=>m[0]))];
for(let i=0;i<urls.length;i++){
 const r=await fetch(urls[i]);if(!r.ok)throw Error(r.status);
 const name='font-'+i+'.woff2';fs.writeFileSync('public/fonts/'+name,Buffer.from(await r.arrayBuffer()));css=css.replaceAll(urls[i],'/fonts/'+name);
}
fs.writeFileSync('public/fonts.css',css);
const pkg=JSON.parse(fs.readFileSync('package.json'));pkg.scripts.build='tailwindcss -i scripts/tailwind.css -o public/utilities.css --minify';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2)+'\n');
const vercel=JSON.parse(fs.readFileSync('vercel.json'));vercel.buildCommand='npm run build';fs.writeFileSync('vercel.json',JSON.stringify(vercel,null,2)+'\n');
})();
