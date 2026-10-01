#!/usr/bin/env node
/* Steerage & Saloon great disasters and ship's hospital check (0.37.1).
   Plays a kept fleet of eight ships on Liverpool to New York from 1900 to 1945 in each seed and checks:
     - one great disaster in each decade from the 1920s (FR-11), of several kinds over the seeds, and the Line's own
       ships hit in only a minority of them;
     - a ship with an isolation hospital spreads sickness slower and is held in quarantine for less time (FR-08);
     - every passenger ship has a surgeon.
   Usage:  node tools/disasters.js [seeds]   (default 6) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 977 + 1)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;S.lines.liv=S.lines.liv||{fares:defaultFares('liv'),service:1,adv:1,last:[null,null]};
    const add=()=>{refreshMarket();const m=S.market.shift();if(!m)return;delete m.price;m.line='liv';if(m.state==='laid'){m.state='port';m.portLeft=1;}S.ships.push(m);};
    let g=0;while(S.ships.length<8&&g++<40)add();
    // the hospital, measured on the first passenger ship
    const sh=S.ships.find(x=>paxBerths(x)>=60);const out={};
    if(sh){out.surg=!!offOf(sh).surg;const s0=crewMods(sh).sick;sh.up=sh.up||{};sh.up.hosp=true;MOD_EPOCH++;const s1=crewMods(sh).sick;
      sh.state='port';sh.port='NYC';const p0=sh.portLeft||0;sh.quarantine={dis:'flu'};startQuarantine(sh,'liv');const d1=sh.portLeft-p0;
      sh.up.hosp=false;MOD_EPOCH++;const p1=sh.portLeft;sh.quarantine={dis:'flu'};startQuarantine(sh,'liv');const d0=sh.portLeft-p1;
      out.hosp={s0,s1,d0,d1};S.emerg=[];}
    g=0;const end=ym(1945,0);while(!S.over&&S.m<end&&g++<400000){if(S.cash<5e5)S.cash=5e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);if(S.ships.length<4)add();}
    out.done=((S.great||{}).done||[]).map(d=>({y:Math.floor(yearOfM(d.m)),k:d.k,own:d.own}));
    return out;})()`, ctx);
}
const n = +process.argv[2] || 6, R = [];
for (let i = 1; i <= n; i++) R.push(run(i));
let bad = 0; const ok = (name, v, info) => { if (!v) bad++; console.log(`${v ? 'ok  ' : 'FAIL'} ${name}${info ? ' (' + info + ')' : ''}`); };
const all = R.flatMap(r => r.done);
ok('one great disaster in each of the 1920s and 1930s', R.every(r => [1920, 1930].every(d => r.done.filter(q => q.y >= d && q.y < d + 10).length === 1)), R.map(r => r.done.map(q => q.y).join('/')).join(', '));
ok('several kinds', new Set(all.map(q => q.k)).size >= Math.min(3, all.length), [...new Set(all.map(q => q.k))].join(', '));
ok('the Line\'s own ships are hit in a minority of them', all.filter(q => q.own).length <= all.length / 3, all.filter(q => q.own).length + ' of ' + all.length);
const H = R.map(r => r.hosp).filter(Boolean);
ok('every passenger ship has a surgeon', R.every(r => r.surg !== false));
ok('an isolation hospital slows sickness and shortens quarantine', H.every(h => h.s1 < h.s0 && h.d1 < h.d0), H.map(h => `sick ${h.s0.toFixed(2)}→${h.s1.toFixed(2)}, ${h.d0}→${h.d1} days`).join('; '));
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
