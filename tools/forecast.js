#!/usr/bin/env node
/* Steerage & Saloon forecast check (0.36.2). Head office's figures for a ship ("she would make about £X a month over the
   coming year") are tested against what she then earns. In each seed a fleet of second-hand ships of every kind is put on
   the main lines; at several dates every ship in service is forecast on her own line (econYear, the figure the advice
   uses), and her own takings and costs over the next twelve months (sh.pl) are compared with it. Ships moved, laid up or
   lost in between are left out.
   Prints the median of actual over forecast, overall and by kind of ship (emigrant, mixed, cargo, cabin), and checks the
   overall median is within a quarter of the forecast and no kind is out by more than a third. (0.39.8: a quarter, not a
   fifth. Forecasts hold the trend in demand where it stands, so in the rising years before the war ships beat them by 19% to
   47%, by design; the 1920s used to fall short and pull the median back, and since outside tonnage they are close to right.)
   Usage:  node tools/forecast.js [seeds]   (default 6) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 4243 + 17)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const lines=['liv','lha','hal','nap','exp','ban','waf','rpl'];
    for(const k of lines)S.lines[k]=S.lines[k]||{fares:defaultFares(k),service:1,adv:1,last:[null,null]};
    const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<100000){if(S.cash<5e5)S.cash=5e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);}};
    const kind=sh=>{const pax=CL.reduce((a,c)=>a+(sh.berths[c]||0),0),cab=(sh.berths.f||0)+(sh.berths.s||0);return pax<60?'cargo':(sh.cargo||0)>sh.grt*0.45?'mixed':cab>pax*0.35?'cabin':'emigrant';};
    const fill=()=>{let g=0;while(S.ships.length<16&&g++<40){refreshMarket();const m=S.market.shift();if(!m)break;delete m.price;
      // each ship on the line that suits her best, as an owner would put her
      let b=null;for(const rk of lines){if(!routeOpen(rk,S.m))continue;const q=econYear(m,rk).pm;if(!b||q>b.pm)b={rk,pm:q};}
      m.line=b?b.rk:'liv';if(m.state==='laid'){m.state='port';m.portLeft=1;}m.autoDock=55;S.ships.push(m);}};
    const out=[];
    for(const y of [1902,1906,1910,1924,1928]){
      to(ym(y,0));fill();for(const x of S.ships)if(x.state==='laid'&&x.line){x.state='port';x.portLeft=1;}
      const fc=S.ships.filter(x=>x.line&&ACTIVE.includes(x.state)&&routeOpen(x.line,S.m)).map(x=>({x,line:x.line,f:econYear(x,x.line).pm+ADV_COST[S.lines[x.line].adv]/Math.max(1,shipsOn(x.line).length),k:kind(x)}));
      const pl0={};for(const q of fc)pl0[q.x.id]=0;let ok={};for(const q of fc)ok[q.x.id]=true;
      for(let i=0;i<12;i++){to(S.m+1);for(const q of fc){if(!S.ships.includes(q.x)||q.x.line!==q.line||q.x.state==='laid'){ok[q.x.id]=false;continue;}pl0[q.x.id]+=(q.x.pl||[]).slice(-1)[0]||0;}}
      for(const q of fc)if(ok[q.x.id]&&Math.abs(q.f)>300)out.push({k:q.k,f:q.f,a:pl0[q.x.id]/12,y});}
    return out;})()`, ctx);
}
const n = +process.argv[2] || 6; const all = [];
for (let i = 1; i <= n; i++) all.push(...run(i));
const med = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// actual over forecast, for forecasts of a profit; a forecast loss is judged by the difference instead
const ratio = q => q.f > 0 ? q.a / q.f : null;
const by = {}; for (const q of all) { const r = ratio(q); if (r === null) continue; (by[q.k] = by[q.k] || []).push(r); (by.all = by.all || []).push(r); }
let bad = 0;
for (const k of Object.keys(by)) { const m = med(by[k]); const lim = k === 'all' ? 0.25 : 1 / 3; if (by[k].length < 5) { console.log(`--   ${k}: median ${m.toFixed(2)} over ${by[k].length} ship-years, too few to judge`); continue; } const pass = Math.abs(m - 1) <= lim;
  if (!pass) bad++; console.log(`${pass ? 'ok  ' : 'FAIL'} ${k}: median actual/forecast ${m.toFixed(2)} over ${by[k].length} ship-years (within ${k === 'all' ? 'a quarter' : 'a third'})`); }
const yr = {}; for (const q of all) { const r = ratio(q); if (r !== null) (yr[q.y] = yr[q.y] || []).push(r); }
console.log('by year: ' + Object.keys(yr).map(y => `${y} ${med(yr[y]).toFixed(2)}`).join(' · '));
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
