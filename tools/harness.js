#!/usr/bin/env node
/* Steerage & Saloon balance harness.
   Loads the real game simulation (no screen), fixes the dice to a seed, and plays 1921-1930
   under scripted strategies. Usage:
     node tools/harness.js                 all strategies, 20 seeds each
     node tools/harness.js advisor 50      one strategy, 50 seeds
   Prints survival, net worth by year, first-year profit, rate wars and profit by route. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'ledger', 'sim', 'rivals', 'state', 'clock', 'advice'].map(f => path.join(ROOT, 'js', f + '.js'));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);

const PRELUDE = `
Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);
const H={
  openLine(rk){if(S.lines[rk]||S.cash<2500)return false;book('office',-2500,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};return true;},
  assign(sh,rk){sh.line=rk||null;if(sh.line&&sh.state==='laid'){sh.state='port';sh.portLeft=1;}},
  buy(m){const dep=Math.round(m.price*0.4);if(S.cash<dep)return null;S.cash-=dep;S.debt+=m.price-dep;delete m.price;S.ships.push(m);S.market=S.market.filter(x=>x!==m);return m;},
  bestRoute(sh){let b=null;for(const rk of Object.keys(ROUTES)){const q=econ(sh,rk);if(!b||q.pm>b.pm)b={rk,pm:q.pm};}return b;},
  apply(h){const a=h.act[0];if(!a)return;const [l,act,...d]=a;
    if(act==='setfare'){const [rk,c,v]=d;if(S.lines[rk])S.lines[rk].fares[c]=v;}
    else if(act==='setfares'){const [rk,f,s2,t]=d;if(S.lines[rk])Object.assign(S.lines[rk].fares,{f,s:s2,t});}
    else if(act==='setlineopt'){const [rk,k,v]=d;if(S.lines[rk])S.lines[rk][k]=v;}
    else if(act==='setship'){const [id,k,v]=d;const x=S.ships.find(q=>q.id===id);if(x)x[k]=v;}
    else if(act==='moveship'){const [id,rk]=d;const x=S.ships.find(q=>q.id===id);if(x)H.assign(x,rk);}
    else if(act==='setyard'){const [id,k]=d;const x=S.ships.find(q=>q.id===id);if(x&&!x.pendingYard){if(x.state==='sea'||x.state==='repo')x.pendingYard=k;else if(S.cash>=refitCost(x,k))enterYard(x,k);}}
    else if(act==='selline'){const [rk]=d;if(!S.lines[rk]&&S.cash>12000)H.openLine(rk);}
    else if(act==='tabgo'&&d[0]==='brokers'){H.expand(12000);}
    UI.rev=(UI.rev||0)+1;},
  expand(buffer){for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep<buffer)continue;
      const b=H.bestRoute(m);if(!b||b.pm<500)continue;const sh=H.buy(m);if(!sh)continue;if(!S.lines[b.rk])H.openLine(b.rk);if(S.lines[b.rk])H.assign(sh,b.rk);return true;}return false;}
};
const STRATS={
  idle(){},
  cautious(){if(S.m===0)S.ships.forEach(s=>{s.autoDock=50;s.maint=1;});},
  advisor(){for(let i=0;i<4;i++){const A=advice().filter(h=>h.act.length);if(!A.length)break;H.apply(A[0]);S.dismiss[A[0].id]=S.m;}},
  expander(){H.expand(8000);},
  undercutter(){for(const rk in S.lines){const L=S.lines[rk],r=ROUTES[rk];L.fares.t=Math.round(r.ref.t*0.75);L.fares.s=Math.round(r.ref.s*0.85);}H.expand(10000);},
  liverpool(){if(!S.lines.liv){if(H.openLine('liv'))S.ships.forEach(s=>H.assign(s,'liv'));}
    else{for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep>10000){const sh=H.buy(m);if(sh)H.assign(sh,'liv');break;}}}}
};
`;

function runGame(strategy, seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(PRELUDE.replace('SEED', String(seed * 7919 + 13)).split('const H=')[0], ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  vm.runInContext(PRELUDE.slice(PRELUDE.indexOf('const H=')), ctx);
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;UI.rev=0;
    const strat=STRATS['${strategy}'];
    const byYear={},routes={},first=[];let wars=0,lastM=-1;
    const origNews=news;news=function(t,k,p){if(/leads a rate war/.test(t))wars++;return origNews(t,k,p);};
    while(!S.over&&S.t<3300){
      if(S.m!==lastM){lastM=S.m;
        if(S.lastMonth){for(const k in S.lastMonth.lines)if(ROUTES[k])routes[k]=(routes[k]||0)+S.lastMonth.lines[k];if(S.lastMonth.m<12)first.push(S.lastMonth.net);}
        if(S.m%12===0)byYear[1921+S.m/12]=Math.round(netWorth());
        strat();}
      advance(1);
    }
    return {bust:S.over==='bust'?S.m:null,final:Math.round(netWorth()),ships:S.ships.length,wars,byYear,routes,firstYear:Math.round(first.reduce((a,b)=>a+b,0)),rep:Math.round(S.rep)};
  })()`, ctx);
}

const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const k = v => (v < 0 ? '-' : '') + '£' + (Math.abs(v) >= 1e6 ? (Math.abs(v) / 1e6).toFixed(2) + 'm' : Math.round(Math.abs(v) / 1000) + 'k');
function report(strategy, n) {
  const R = []; for (let i = 0; i < n; i++) R.push(runGame(strategy, i + 1));
  const busts = R.filter(r => r.bust !== null);
  const yrs = [1922, 1924, 1926, 1928, 1930];
  const med = y => { const v = R.map(r => r.byYear[y]).filter(v => v !== undefined); return v.length ? k(pct(v, 0.5)) : '-'; };
  const routes = {}; R.forEach(r => { for (const q in r.routes) routes[q] = (routes[q] || 0) + r.routes[q] / n; });
  console.log(`\n${strategy.toUpperCase()}  (${n} runs)`);
  console.log(`  bankrupt: ${busts.length}/${n}${busts.length ? ' (median month ' + pct(busts.map(b => b.bust), 0.5) + ')' : ''}`);
  console.log(`  first-year profit: median ${k(pct(R.map(r => r.firstYear), 0.5))}, range ${k(pct(R.map(r => r.firstYear), 0))} to ${k(pct(R.map(r => r.firstYear), 1))}`);
  console.log(`  median net worth: ` + yrs.map(y => `${y} ${med(y)}`).join(' · '));
  console.log(`  final net worth: p10 ${k(pct(R.map(r => r.final), 0.1))} · median ${k(pct(R.map(r => r.final), 0.5))} · p90 ${k(pct(R.map(r => r.final), 0.9))}`);
  console.log(`  fleet at end (median): ${pct(R.map(r => r.ships), 0.5)} · rate wars per game: ${(R.reduce((a, r) => a + r.wars, 0) / n).toFixed(1)} · reputation ${pct(R.map(r => r.rep), 0.5)}`);
  console.log(`  avg profit by route over game: ` + Object.entries(routes).sort((a, b) => b[1] - a[1]).map(([q, v]) => `${q} ${k(v)}`).join(' · '));
}
const [, , only, nArg] = process.argv;
const n = +nArg || 20;
const t0 = Date.now();
for (const s of only ? [only] : ['idle', 'cautious', 'advisor', 'expander', 'undercutter', 'liverpool']) report(s, n);
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
