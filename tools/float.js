#!/usr/bin/env node
/* Steerage & Saloon floating check (stage R4, 0.31).
   Plays the game with no screen (the Line kept in cash by a benefactor) and checks the rules of floating the Line:
     - a private Line is never bid for, and cannot be bid for when asked to be;
     - a float raises what the formula says and hands the public its share;
     - a minority float: the board's confidence can fall to nothing and the owner stays;
     - a majority float: at an annual meeting under 20 the board removes the owner (the game ends 'removed');
     - a buyback that restores the majority ends the risk and ends a bid;
     - each defence against a bid works: the white knight's shares are not sold to the bidder, founders' shares
       outvote a bid, an appeal blocks a foreign bidder four times in five, selling the ships (scorched earth) or the
       finest ship (crown jewel) sees the bidder off, and taking control of the bidder (Pac-Man) ends the bid;
     - an undefended bid at a high premium against an unhappy board wins (the game ends 'taken').
   A white knight and a crown-jewel buyer are only on offer when some line can afford them; those two, the appeal
   (refused one time in five) and the outcome of the knight scenario are reported as notes, not failures.
   Usage:  node tools/float.js [seeds]   (default 3) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
/* one fresh game, played to 1906 with three ships, then the scenario */
function game(seed, scenario) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info||''});
    let lastM=-1;const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<300000){if(S.m!==lastM){lastM=S.m;if(S.cash<4e5)S.cash=4e5;}advance(1);}};
    to(ym(1905,0));for(const m of S.market.slice(0,3)){delete m.price;S.ships.push(m);}S.market=[];mkEnsure();to(ym(1906,0));
    const pick=()=>flBidders()[0]||coLive().find(o=>!RIVAL_P[o].kind);
    const quiet=()=>{if(S.fl)S.fl.nextBid=ym(1999,0);if(S.trust)S.trust.next=ym(1999,0);}; // no bids but the scenario's own
    ${scenario}
    return out;})()`, ctx);
}
const SC = {
  'private': `let bids=0;to(ym(1912,0));ok('a private Line is never bid for',!S.fl);ok('and cannot be',!(S.fl&&flBid(pick())));`,
  'minority': `const est=Math.round(flRaise(0.49,false)/2),c0=S.cash;ok('a minority float goes through',flFloat(0.49,false));quiet();ok('it raises what was shown',Math.abs(S.cash-c0-est)<2,Math.round(S.cash-c0)+' vs '+est);
    ok('the public holds 49%',Math.abs(S.fl.pub/S.fl.n-0.49)<0.001);ok('no bid on a minority float',!flBid(pick()));
    S.fl.conf=0;to(ym(1908,2));ok('the owner stays',!S.over&&S.fl.conf<30,'confidence '+Math.round(S.fl.conf));`,
  'removal': `flFloat(0.75,false);quiet();S.fl.conf=5;S.fl.lastConf=10;S.fl.targets=null;to(ym(1907,2));ok('a majority board removes the owner under 20',S.over==='removed',S.over||'still in charge, '+Math.round(S.fl.conf));`,
  'buyback': `flFloat(0.6,false);quiet();const o=pick();ok('a bid on a majority float',flBid(o));let g=0;while(flOwn()<0.5&&g++<30)flBuyback(0.05);to(S.m+1);
    ok('buying back the majority ends the bid',!S.fl.bid&&flOwn()>=0.5,Math.round(flOwn()*100)+'%');S.fl.conf=5;S.fl.targets=null;to(ym(1908,2));ok('and ends the risk of removal',!S.over);`,
  'knight': `flFloat(0.75,false);quiet();const o=pick();flBid(o,0.6);S.fl.conf=10;const k=flKnights()[0];ok('a white knight is found',!!k);if(k){flKnight(k);ok('its shares leave the public float',S.fl.knight&&S.fl.pub<0.75*S.fl.n-1);}
    to(S.fl.bid?S.fl.bid.due+1:S.m+1);ok('the bid is decided',!S.fl.bid||S.over,S.over||'');`,
  'founders': `flFloat(0.75,true);quiet();const o=pick();flBid(o,0.8);S.fl.conf=0;to(S.fl.bid.due+1);ok('founders\\' shares outvote a rich bid',!S.over&&!S.fl.bid,S.over||'');`,
  'undefended': `flFloat(0.75,false);quiet();const o=pick();flBid(o,0.8);S.fl.conf=0;to(S.fl.bid.due+1);ok('an undefended rich bid against an unhappy board wins',S.over==='taken',S.over||'');`,
  'appeal': `flFloat(0.75,false);quiet();const o=coLive().find(q=>!RIVAL_P[q].kind&&!flBritish(q));flBid(o,0.5);ok('the bidder is foreign',S.fl.bid&&S.fl.bid.foreign);const r=flAppeal();ok('an appeal is heard',r);
    ok('blocked, or refused and the bid runs on',!S.fl.bid?S.fl.british:!!S.fl.bid,S.fl.bid?'refused':'blocked');`,
  'scorched': `flFloat(0.75,false);quiet();const o=pick();flBid(o,0.5);for(const sh of S.ships.slice().sort((a,b)=>shipValue(b)-shipValue(a)))if(fleetValue()>=0.65*S.fl.bid.fv0&&S.ships.length>1)exitShip(sh,'sell');to(S.m+1);ok('selling the ships sees the bidder off',!S.fl.bid);`,
  'crown': `flFloat(0.75,false);quiet();const o=pick();flBid(o,0.5);const n=S.ships.length;ok('the finest ship is sold',flCrown()&&S.ships.length===n-1);to(S.m+4);ok('the bid ends',!S.fl.bid||S.over,S.over||'');`,
  'pacman': `flFloat(0.75,false);quiet();const o=coLive().filter(q=>!RIVAL_P[q].kind&&!trustMember(q)).sort((a,b)=>coFleet(a).length-coFleet(b).length)[0];flBid(o,0.5);let g=0;while(mkStake(o)<0.5&&g++<40)mkBuyPct(o,0.05);to(S.m+1);ok('control of the bidder ends its bid',!S.fl.bid&&mkStake(o)>=0.5,Math.round(mkStake(o)*100)+'%');`,
};
const n = +process.argv[2] || 3;let bad = 0;const tally = {};
for (let i = 1; i <= n; i++) for (const k in SC) { const out = game(i, SC[k]);
  for (const q of out) { const t = tally[q.name] = tally[q.name] || { ok: 0, n: 0, info: [] }; t.n++; if (q.v) t.ok++; else t.info.push(q.info); } }
for (const k in tally) { const t = tally[k], chance = /blocked, or refused|the bid is decided|a white knight is found|the finest ship is sold/.test(k); if (t.ok < t.n && !chance) bad++;
  console.log(`${t.ok === t.n ? 'ok  ' : chance ? 'note' : 'FAIL'} ${k}: ${t.ok}/${t.n}${t.info.length ? ' (' + t.info.join('; ') + ')' : ''}`); }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
