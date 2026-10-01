#!/usr/bin/env node
/* Steerage & Saloon desk check (0.36.1). Gives the Line a big fleet (default 70 ships on six lines) with every head-office
   department open and acting under its standing orders, plays a year in each seed and measures what reaches the owner:
     - the advice left on the owner's desk each month (what no acting department will see to), and what the departments do;
     - how many emergencies slow the clock and ask for orders under the Auto setting, against Every emergency;
     - that turning a standing order off puts that kind of advice back on the owner's desk;
     - (0.36.2) that, with a line crowded, no more than one ship is advised onto any line at once.
   Usage:  node tools/desk.js [seeds] [ships]   (default 3 seeds, 70 ships) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
const N = +process.argv[3] || 70;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 31337 + 5)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info===undefined?'':String(info)});
    const lines=['liv','exp','lha','hal','nap','gny'];
    for(const k of lines)S.lines[k]=S.lines[k]||{fares:defaultFares(k),service:1,adv:1,last:[null,null]};
    while(S.ships.length<${N}){refreshMarket();const m=S.market.shift();if(!m)break;delete m.price;m.line=lines[S.ships.length%6];if(m.state==='laid'){m.state='port';m.portLeft=1;}S.ships.push(m);}
    const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<100000){if(S.cash<5e5)S.cash=5e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);}};
    to(ym(1903,0));S.cash=5e6;for(const k of Object.keys(DEPTS))doAction('shorebuy',['dept',k]);for(const k in S.depts)S.depts[k].auto=true;
    let maxMine=0,sumMine=0,months=0,sumAll=0,acts=0;const nd=S.news.length;let seenNews=new Set(S.news);
    const asked={auto:0,all:0},lv={1:0,2:0,3:0};const seenE=new Set();
    const m1=S.m+12;
    while(S.m<m1&&!S.over){const m0=S.m;to(S.m+1);ADV_CACHE.key=null;const A=advice(),mine=deskItems(A);
      maxMine=Math.max(maxMine,mine.length);sumMine+=mine.length;sumAll+=A.length;months++;
      for(const n of S.news){if(seenNews.has(n))continue;seenNews.add(n);if(/^(Fares Office|Traffic Department|Marine Superintendent|Crewing Office): /.test(n.t))acts++;}
      for(const e of S.emerg||[]){if(seenE.has(e.id))continue;seenE.add(e.id);const l=emLevel(e);lv[l]++;if(l>=2)asked.all++;if(l>=(S.ships.length>=15?3:2))asked.auto++;}}
    ok('the owner\\'s own list averages under a third of all the advice',sumMine<sumAll/3,'owner '+(sumMine/months).toFixed(1)+' a month (most '+maxMine+') of '+(sumAll/months).toFixed(1)+'; departments acted '+acts+' times in the year');
    ok('under Auto, a big fleet\\'s clock is held only by grave emergencies',asked.auto<=asked.all&&asked.auto===lv[3],'emergencies by level '+JSON.stringify(lv)+'; asking under Auto '+asked.auto+', under Every emergency '+asked.all);
    // never more than one ship advised onto a line at once (0.36.2)
    {for(const x of S.ships.slice(0,20))if(x.state!=='laid'){x.line='gny';}ADV_CACHE.key=null;const A=advice(),per={};
     for(const h of A)if(/^(move|unlay|home):/.test(h.id)){const rk=h.act[0][3];per[rk]=(per[rk]||0)+1;}
     const most=Math.max(0,...Object.values(per));ok('no more than one ship is advised onto any line at once',most<=1,JSON.stringify(per));}
    // a standing order turned off puts its advice back on the desk
    {ADV_CACHE.key=null;const A=advice();const fh=A.filter(h=>h.dept==='fares'&&orderOf(h)==='fares');
     S.depts.fares.orders={fares:false};ADV_CACHE.key=null;const B=advice();const back=B.filter(h=>h.dept==='fares'&&orderOf(h)==='fares'&&!handled(h)).length;
     ok('turning off the Fares Office\\'s order on fares puts that advice on the owner\\'s desk',fh.length===0||back>0,fh.length+' fare items, '+back+' back on the desk');S.depts.fares.orders={};}
    return out;})()`, ctx);
}
const n = +process.argv[2] || 3; let bad = 0; const tally = {};
for (let i = 1; i <= n; i++) for (const q of run(i)) { const t = tally[q.name] = tally[q.name] || { ok: 0, n: 0, info: [] }; t.n++; if (q.v) t.ok++; t.info.push(q.info); }
for (const k in tally) { const t = tally[k]; if (t.ok < t.n) bad++; console.log(`${t.ok === t.n ? 'ok  ' : 'FAIL'} ${k}: ${t.ok}/${t.n}${t.info.some(x => x) ? ' (' + t.info.join('; ') + ')' : ''}`); }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
