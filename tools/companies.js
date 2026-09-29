#!/usr/bin/env node
/* Steerage & Saloon rival companies check.
   Plays the game with no screen for a number of years under a plain strategy (the Morven Line buys
   ships it can afford and puts them on its best route, and is never allowed to go bust), and reports what the rival companies did:
   fleets, cash, debt, failures and new lines, year by year. Usage:
     node tools/companies.js               40 years, 10 seeds
     node tools/companies.js 40 20 verbose  40 years, 20 seeds, print each seed's failures
   Pass/fail checks (printed at the end): no line ever holds more than 65% of all rival tonnage,
   no route is left without a rival for more than two years outside a slump (in a slump the
   promoters wait for better times, so a small cruise trade may lie empty), and failures happen at a few
   a decade. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice', 'times']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;

function run(seed, years) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;
    const fails=[],entrants=[],yearly=[],empty={};let lastM=-1;
    const on=news;news=function(t,k,p){if(/has failed|been wound up/.test(t))fails.push(YEAR0+Math.floor(S.m/12)+': '+t);if(/new line|starts sailing|enters the/.test(t)&&/Line|Company|Co\\./.test(t))entrants.push(YEAR0+Math.floor(S.m/12)+': '+t);return on(t,k,p);};
    const expand=()=>{for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep<Math.max(12000,3*runningCost()))continue;
      let b=null;for(const rk of Object.keys(ROUTES)){const q=econ(m,rk);if(!b||q.pm>b.pm)b={rk,pm:q.pm};}if(!b||b.pm<500)continue;
      S.cash-=dep;S.debt+=m.price-dep;delete m.price;S.ships.push(m);S.market=S.market.filter(x=>x!==m);
      if(!S.lines[b.rk]&&S.cash>2500){book('office',-2500,b.rk);S.lines[b.rk]={fares:defaultFares(b.rk),service:1,adv:1,last:[null,null]};}
      if(S.lines[b.rk]){m.line=b.rk;}return;}};
    while(!S.over&&S.m-S.m0<${years}*12){
      if(S.m!==lastM){lastM=S.m;if(S.cash<20000)S.cash=20000;expand(); // a benefactor keeps the Morven Line afloat: this check is about the rivals
        for(const rk in ROUTES){if(!routeOpen(rk,S.m))continue;const n=S.rships.filter(x=>x.route===rk).length;empty[rk]=n?0:(empty[rk]||0)+(slump(S.m)>0.2?0:1);/* slump months do not count: promoters wait for better times */if(empty[rk]>24){empty.flag=(empty.flag||0)+1;(empty.where=empty.where||{})[rk]=YEAR0+Math.floor(S.m/12);}}
        if(S.m%12===0){const by={};for(const x of S.rships)by[x.owner]=(by[x.owner]||0)+x.grt;
          const tot=Object.values(by).reduce((a,b)=>a+b,0),top=Math.max(0,...Object.values(by));
          const cos=typeof coAll==='function'?coAll():[];
          yearly.push({y:YEAR0+S.m/12,ships:S.rships.length,grt:tot,top:top/Math.max(1,tot),lines:Object.keys(by).length,
            cash:cos.reduce((a,c)=>a+c.cash,0),debt:cos.reduce((a,c)=>a+(c.debt||0),0),ours:S.ships.length,px:PX()});}}
      advance(1);
    }
    return {fails,entrants,yearly,emptyFlag:empty.flag||0,emptyWhere:Object.keys(empty.where||{}),emptyAt:empty.where||{},bust:S.over==='bust'||S.over==='wound'};
  })()`, ctx);
}
const [, , yA, nA, verbose] = process.argv, years = +yA || 40, n = +nA || 10;
const R = []; for (let i = 0; i < n; i++) R.push(run(i + 1, years));
const k = v => (v < 0 ? '-' : '') + '£' + (Math.abs(v) >= 1e6 ? (Math.abs(v) / 1e6).toFixed(1) + 'm' : Math.round(Math.abs(v) / 1000) + 'k');
console.log(`RIVAL COMPANIES  (${n} runs, ${years} years)`);
console.log('year  ships  tonnage   lines  top share  cash      debt      our fleet');
const ys = R[0].yearly.map(q => q.y);
for (const y of ys) {
  const rows = R.map(r => r.yearly.find(q => q.y === y)).filter(Boolean), av = f => rows.reduce((a, q) => a + f(q), 0) / rows.length;
  console.log(`${y}  ${av(q => q.ships).toFixed(0).padStart(5)}  ${(av(q => q.grt) / 1e6).toFixed(2).padStart(6)}m  ${av(q => q.lines).toFixed(1).padStart(5)}  ${(av(q => q.top) * 100).toFixed(0).padStart(8)}%  ${k(av(q => q.cash)).padStart(8)}  ${k(av(q => q.debt)).padStart(8)}  ${av(q => q.ours).toFixed(1).padStart(8)}`);
}
const fpd = R.reduce((a, r) => a + r.fails.length, 0) / n / (years / 10), epd = R.reduce((a, r) => a + r.entrants.length, 0) / n / (years / 10);
const maxTop = Math.max(...R.flatMap(r => r.yearly.map(q => q.top)));
console.log(`\nfailures per decade ${fpd.toFixed(1)} · new lines per decade ${epd.toFixed(1)} · largest share of rival tonnage ever ${(maxTop * 100).toFixed(0)}% · route-months with no rival past two years (outside a slump) ${R.reduce((a, r) => a + r.emptyFlag, 0)} · player busts ${R.filter(r => r.bust).length}/${n}`);
const dec = {}; R.forEach(r => r.fails.forEach(t => { const d = t.slice(0, 3) + '0s'; dec[d] = (dec[d] || 0) + 1 / n; }));
console.log('failures by decade (per game): ' + Object.entries(dec).sort().map(([d, v]) => `${d} ${v.toFixed(1)}`).join(' · '));
const ew = {}; R.forEach(r => r.emptyWhere.forEach(q => ew[q] = (ew[q] ? ew[q] + ', ' : '') + r.emptyAt[q])); if (Object.keys(ew).length) console.log('routes left empty over two years (year first flagged, per game): ' + Object.entries(ew).map(([q, v]) => q + ' ' + v).join(' · '));
if (verbose) R.forEach((r, i) => { console.log(`\nseed ${i + 1}`); r.fails.forEach(t => console.log('  ' + t)); r.entrants.forEach(t => console.log('  ' + t)); });
const ok = maxTop <= 0.65 && R.every(r => r.emptyFlag === 0) && fpd >= 0.5 && fpd <= 6;
console.log(ok ? 'PASS' : 'CHECK: see the figures above');
