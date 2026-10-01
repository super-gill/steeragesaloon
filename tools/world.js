#!/usr/bin/env node
/* Steerage & Saloon world check (0.35.7). Plays a small fleet from 1900 to 1927 in each seed and checks that the world
   stays consistent:
     - no two ships afloat share a name (the Line's, the rivals', the brokers' and the yards');
     - no two rival lines share a name, however many are founded;
     - in the war, the rivals' ships do not fill the news moving from one closed trade to another;
     - a silent ship is reported overdue but safe no more than about once in two years of service (an old fleet);
     - a fare set at the line rate in December is not raised by a whole year's inflation in January.
   Usage:  node tools/world.js [seeds]   (default 6) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 104729 + 7)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info===undefined?'':String(info)});
    const lines=['liv','hal','nap','lha'];
    while(S.ships.length<6){refreshMarket();const m=S.market.shift();if(!m)break;delete m.price;m.line=lines[S.ships.length%4];if(m.state==='laid'){m.state='port';m.portLeft=1;}S.ships.push(m);}
    for(const k of lines)S.lines[k]=S.lines[k]||{fares:defaultFares(k),service:1,adv:1,last:[null,null]};for(const x of S.ships)x.autoDock=60; // a kept fleet: drydocked when condition falls below 60
    let dupMax=0,dupAt='',moveMax=0,od=0,sy=0,fareGap=0,refDec=0;const seen=new Set();
    const names=()=>[...S.ships,...S.rships,...(S.market||[])].map(x=>x.name);
    while(S.m<ym(1927,0)&&!S.over){
      const m0=S.m;
      // a fare set at the rate in December
      if(S.m%12===11){const L=S.lines.liv;if(L){refDec=ROUTES.liv.ref.f;L.fares={...L.fares,f:refDec};}}
      while(S.m===m0&&!S.over){if(S.cash<3e5)S.cash=3e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);
        sy+=S.ships.filter(x=>x.state!=='laid'&&isSilent(x)).length/365;}
      if(S.m%12===0&&S.lines.liv&&refDec){const g=S.lines.liv.fares.f/refDec;fareGap=Math.max(fareGap,Math.abs(g-1));}
      const n=names(),d=n.length-new Set(n).size;if(d>dupMax){dupMax=d;dupAt=monthName(S.m)+': '+n.filter((x,i)=>n.indexOf(x)!==i).slice(0,3).join(', ');}
      let mv=0;for(const x of S.news){if(seen.has(x))continue;seen.add(x);if(/ moves SS /.test(x.t)&&atWar(S.m-1))mv++;if(/overdue but safe/.test(x.t))od++;}
      moveMax=Math.max(moveMax,mv);}
    const cn=Object.values(RIVALS).map(r=>r.name),cd=cn.filter((x,i)=>cn.indexOf(x)!==i);
    ok('no two ships afloat share a name',dupMax===0,dupMax?dupMax+' at '+dupAt:'');
    ok('no two rival lines share a name',cd.length===0,cd.slice(0,3).join(', ')+' ('+cn.length+' lines)');
    ok('in the war, no more than 4 rival ships a month move trades',moveMax<=4,moveMax);
    ok('overdue but safe no more than about once in two ship-years of an old silent fleet',od/Math.max(1,sy)<=0.45,od+' in '+sy.toFixed(0)+' ship-years');
    ok('a fare set at the rate in December is not raised by a year of inflation in January',fareGap<=0.03,(fareGap*100).toFixed(1)+'%');
    return out;})()`, ctx);
}
const n = +process.argv[2] || 6; let bad = 0; const tally = {};
for (let i = 1; i <= n; i++) for (const q of run(i)) { const t = tally[q.name] = tally[q.name] || { ok: 0, n: 0, info: [] }; t.n++; if (q.v) t.ok++; t.info.push(q.info); }
for (const k in tally) { const t = tally[k]; if (t.ok < t.n) bad++; console.log(`${t.ok === t.n ? 'ok  ' : 'FAIL'} ${k}: ${t.ok}/${t.n}${t.info.some(x => x) ? ' (' + t.info.join('; ') + ')' : ''}`); }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
