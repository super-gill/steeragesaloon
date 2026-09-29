#!/usr/bin/env node
/* Steerage & Saloon balance harness.
   Loads the real game simulation (no screen), fixes the dice to a seed, and plays the first
   fifteen years (1900 to 1914) under scripted strategies. Usage:
     node tools/harness.js                 all strategies, 20 seeds each
     node tools/harness.js advisor 50      one strategy, 50 seeds
   Prints survival, net worth by year, first-year profit, rate wars and profit by route. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice', 'times'].map(f => path.join(ROOT, 'js', f + '.js'));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]).map(([f, s]) => [f, process.env.PATCH ? s.replace(/^const /gm, 'var ') : s]);

const PRELUDE = `
Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);
const H={
  openLine(rk){if(S.lines[rk]||S.cash<2500)return false;book('office',-2500,rk);S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};return true;},
  assign(sh,rk){sh.line=rk||null;if(sh.line&&sh.state==='laid'){sh.state='port';sh.portLeft=1;}},
  buy(m){const dep=Math.round(m.price*0.4);if(S.cash<dep)return null;S.cash-=dep;S.debt+=m.price-dep;delete m.price;S.ships.push(m);S.market=S.market.filter(x=>x!==m);return m;},
  bestRoute(sh){let b=null;for(const rk of Object.keys(ROUTES)){if(!routeOpen(rk,S.m))continue;const q=econYear(sh,rk);/* a sensible buyer looks at the year ahead, not one month */if(!b||q.pm>b.pm)b={rk,pm:q.pm};}return b;},
  apply(h){const a=h.act[0];if(!a)return;const [l,act,...d]=a;
    if(['setfare','setfares','setlineopt','setship','moveship','setyard','sellship','hire','buyship','openmove','shorebuy'].includes(act))doAction(act,d);
    else if(act==='build'){const dz=JSON.parse(JSON.stringify(d[0]));dz.name='Harness '+(S.yardNext||534);placeOrder(dz);}
    else if(act==='tabgo'&&d[0]==='shore'){const [k,key]=h.id.split(':');
      if(k==='pier'||k==='agency'){if(canSpend(shoreCost(k,key)))doAction('shorebuy',[k,key]);}
      else if(k.startsWith('bunker'))doAction('shorebuy',['bunker']);
      else if(k.startsWith('dept')){const q=Object.keys(DEPTS).find(x=>!S.depts[x]);if(q&&canSpend(DEPTS[q].cost))doAction('shorebuy',['dept',q]);}}
    else if(act==='selline'){const [rk]=d;if(!S.lines[rk]&&S.cash>12000)H.openLine(rk);}
    else if(act==='tabgo'&&d[0]==='brokers'){H.expand(12000,true);}
    UI.rev=(UI.rev||0)+1;},
  /* in the war a careful owner zigzags, joins the convoys, paints and arms, and tops up the insurance */
  warProt(){if(!atWar())return;for(const x of S.ships){if(x.state==='req')continue;x.zigzag=1;if(convoyOK())x.convoy=1;x.warTop=1;
    if(S.m>=DAZZLE_FROM&&!x.dazzle&&!x.pendingYard&&x.state!=='yard'&&S.cash>refitCost(x,'dazzle')*3)doAction('setyard',[x.id,'dazzle']);
    else if(warGoodwill()&&!x.gun&&!x.pendingYard&&x.state!=='yard'&&S.cash>refitCost(x,'gun')*3)doAction('setyard',[x.id,'gun']);}
    for(const x of S.ships)if(!x.reserve&&S.m>=RESERVE_FROM&&S.m<WAR_FROM)x.reserve=true;},
  /* after the Board of Trade's ruling a sensible owner fits boats for all before the law bites */
  boats(){if(!newCal()||S.m<BOAT_NEWS)return;for(const x of S.ships)if(!hasBoats(x)&&paxBerths(x)>0&&!x.pendingYard&&x.state!=='yard'&&S.cash>refitCost(x,'boats')*2)doAction('setyard',[x.id,'boats']);},
  expand(buffer,prudent){buffer=Math.max(buffer,prudent?3*runningCost():0);for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep<buffer)continue;
      const b=H.bestRoute(m);if(!b||b.pm<500)continue;const sh=H.buy(m);if(!sh)continue;if(!S.lines[b.rk])H.openLine(b.rk);if(S.lines[b.rk])H.assign(sh,b.rk);return true;}return false;}
};
const STRATS={
  idle(){},
  cautious(){H.boats();if(S.m===S.m0)S.ships.forEach(s=>{s.autoDock=50;s.maint=1;});},
  advisor(){for(let i=0;i<4;i++){const A=advice().filter(h=>h.act.length);if(!A.length)break;H.apply(A[0]);S.dismiss[A[0].id]=S.m;}},
  expander(){H.expand(8000);},
  prudent(){H.expand(12000,true);},
  /* the sensible owner the 1900 targets are set for: keeps six months' running costs in hand, borrows no more than half
     the fleet's value, buys only ships that should earn a sixth of their price a year, and lays up a ship that loses money */
  careful(){const run=runningCost();H.boats();if(typeof PROT==='undefined'||PROT!=='0')H.warProt();
    // on rumours of a panic a careful owner puts spare cash into government stock, safe from a failing bank; after it, back
    if(S.crash&&S.crash.stage==='rumour'){const spare=Math.floor((S.cash-3*run)/1000)*1000;if(spare>0)gilts(true,spare);return;}
    if(S.gilts>0&&(!S.crash&&!S.call||S.cash<3*run))gilts(false,S.gilts); // back out of stock after the panic, or to pay the bills
    // overdrawn and sinking: raise cash by selling the ship that earns least for her value, before the bank forecloses
    if(S.cash<-0.35*odLimit()&&S.ships.length>1&&!S.ships.some(x=>x.pendingExit)){const w=S.ships.filter(x=>x.state==='port'||x.state==='laid'||x.state==='sea').map(x=>({x,y:(x.pl||[]).reduce((a,v)=>a+v,0)/Math.max(1,shipValue(x))})).sort((a,b)=>a.y-b.y)[0];if(w)doAction('sellship',[w.x.id]);}
    if(S.crash||S.call)return;
    if(S.debt>0&&S.cash>12*run){const r=Math.min(S.debt,Math.floor((S.cash-12*run)/1000)*1000);if(r>0){S.cash-=r;S.debt-=r;}} // pay down the mortgage when flush
    if(S.debt-Math.max(0,S.cash)<0.35*fleetValue()&&shipMkt()<=1.3)for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep<Math.max(12000*PX(),6*run))continue;
      const b=H.bestRoute(m);if(!b||b.pm*12<m.price/8)continue;const sh=H.buy(m);if(!sh)continue;if(!S.lines[b.rk])H.openLine(b.rk);if(S.lines[b.rk])H.assign(sh,b.rk);break;}
    // twice a year: a ship that lost money over the year goes where she would pay, or is sold; a worn-out one is sold
    if(S.m%6===0)for(const x of S.ships.slice()){if(S.ships.length<2)break;const loss=(x.pl||[]).length>=12&&x.pl.reduce((a,v)=>a+v,0)<0;
      if(fatOf(x)>=85||(loss||!x.line)&&(()=>{const b=H.bestRoute(x);if(b&&b.pm>0&&x.line!==b.rk){if(!S.lines[b.rk])H.openLine(b.rk);if(S.lines[b.rk]){H.assign(x,b.rk);return false;}}return loss||!x.line;})())doAction('sellship',[x.id]);}},
  office(){for(const k of ['fares','marine','traffic','crew'])if(S.ships.length>=3&&!S.depts[k]&&canSpend(DEPTS[k].cost)){doAction('shorebuy',['dept',k]);doAction('deptmode',[k,true]);}
    H.expand(12000,true);},
  undercutter(){for(const rk in S.lines){const L=S.lines[rk],r=ROUTES[rk];L.fares.t=Math.round(r.ref.t*0.75);L.fares.s=Math.round(r.ref.s*0.85);}H.expand(10000);},
  liverpool(){if(!S.lines.liv){if(H.openLine('liv'))S.ships.forEach(s=>H.assign(s,'liv'));}
    else{for(const m of S.market.slice()){const dep=Math.round(m.price*0.4);if(S.cash-dep>10000){const sh=H.buy(m);if(sh)H.assign(sh,'liv');break;}}}}
};
`;

function runGame(strategy, seed) {
  const ctx = { console, PROT: process.env.PROT, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(PRELUDE.replace('SEED', String(seed * 7919 + 13)).split('const H=')[0], ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  if (process.env.PATCH) vm.runInContext(process.env.PATCH, ctx); // e.g. PATCH='rollEmergency=()=>null' to switch a system off
  vm.runInContext(PRELUDE.slice(PRELUDE.indexOf('const H=')), ctx);
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;UI.rev=0;
    const strat=STRATS['${strategy}'];
    const byYear={},fleetY={},routes={},first=[],trace=[],keyN=[],cats={},warSet=new Set();let warLost=0,warReqLost=0,adj1919=null;let wars=0,lastM=-1,lost=0,emerg=0;
    const origNews=news;news=function(t,k,p){if(/sunk by the enemy/.test(t))(globalThis.SUNK=globalThis.SUNK||[]).push(monthName(S.m)+': '+t.slice(0,200));if(k==='bad'&&p){keyN.push(monthName(S.m)+': '+t.slice(0,150));if(keyN.length>14)keyN.shift();}if(/leads a rate war|fall out on|answers with a rate war/.test(t))wars++;if(/ is lost|constructive total loss/.test(t))lost++;if(/is sunk by the enemy|captured by a German raider/.test(t))warLost++;if(/on war service as .* has been sunk/.test(t))warReqLost++;return origNews(t,k,p);};
    while(!S.over&&S.t-S.t0<(${+(process.env.END||1915)}-1900)*365.25){
      if(S.m!==lastM){lastM=S.m;
        if(S.lastMonth){const yy=YEAR0+Math.floor(S.lastMonth.m/12);cats[yy]=cats[yy]||{};for(const k in S.lastMonth.cat)cats[yy][k]=(cats[yy][k]||0)+Math.round(S.lastMonth.cat[k]);}if(S.lastMonth){for(const k in S.lastMonth.lines)if(ROUTES[k])routes[k]=(routes[k]||0)+S.lastMonth.lines[k];if(S.lastMonth.m-S.m0<12)first.push(S.lastMonth.net);}
        if(S.m%12===0){byYear[YEAR0+S.m/12]=Math.round(netWorth());fleetY[YEAR0+S.m/12]=S.ships.length;}
        if(S.m===ym(1919,0))adj1919=Math.round(netWorth()-fleetValue()*(1-1/warShips(S.m)));
        if(atWar())for(const x of S.ships)warSet.add(x.id);
        if(S.m%6===0)trace.push(\`\${monthName(S.m)} cash \${Math.round(S.cash/1000)}k debt \${Math.round(S.debt/1000)}k gilts \${Math.round((S.gilts||0)/1000)}k fleet \${S.ships.length} val \${Math.round(fleetValue()/1000)}k nw \${Math.round(netWorth()/1000)}k\`);
        strat();}
      advance(1);
    }
    return {bust:S.over==='bust'||S.over==='wound'?S.m-S.m0:null,wound:S.over==='wound',last:S.over?S.news.slice(0,8).map(n=>n.t):null,trace,keyN,cats,ships:S.ships.length,warLost,warReqLost,adj1919,warShips:warSet.size,sunk:globalThis.SUNK||[],final:Math.round(netWorth()),ships:S.ships.length,wars,byYear,fleetY,routes,firstYear:Math.round(first.reduce((a,b)=>a+b,0)),rep:Math.round(S.rep),lost,emerg:(S.emerg||[]).filter(e=>e.k!=='quar').length};
  })()`, ctx);
}

const pct = (a, p) => { const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))]; };
const k = v => (v < 0 ? '-' : '') + '£' + (Math.abs(v) >= 1e6 ? (Math.abs(v) / 1e6).toFixed(2) + 'm' : Math.round(Math.abs(v) / 1000) + 'k');
function report(strategy, n) {
  const R = []; for (let i = 0; i < n; i++) R.push(runGame(strategy, i + 1));
  const busts = R.filter(r => r.bust !== null);
  if (process.env.DEBUG === '3') { const q = (R.find(r => r.bust === null) || R[0]); console.log(q.trace.slice(26).join('\n')); const c = q.cats; for (const y in c) console.log(y, Object.entries(c[y]).filter(([k, v]) => Math.abs(v) > 500).map(([k, v]) => k + ' ' + Math.round(v / 1000) + 'k').join(' · ')); }
  if (process.env.DEBUG) busts.forEach(b => console.log('BUST', b.bust, b.wound ? 'wound' : '', '\n  ' + (process.env.DEBUG === '2' ? b.trace.join('\n  ') + '\n  --\n  ' + b.keyN.join('\n  ') : b.last.join('\n  '))));
  const y0 = Math.min(...R.flatMap(r => Object.keys(r.byYear).map(Number))), yrs = [1, 2, 4, 6, 8, 10, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(d => y0 + d).filter(y => y <= +(process.env.END || 1915));
  const med = y => { const v = R.map(r => r.byYear[y]).filter(v => v !== undefined); return v.length ? k(pct(v, 0.5)) : '-'; };
  const routes = {}; R.forEach(r => { for (const q in r.routes) routes[q] = (routes[q] || 0) + r.routes[q] / n; });
  console.log(`\n${strategy.toUpperCase()}  (${n} runs)`);
  console.log(`  bankrupt: ${busts.length}/${n}${busts.length ? ' (median month ' + pct(busts.map(b => b.bust), 0.5) + ')' : ''}`);
  console.log(`  first-year profit: median ${k(pct(R.map(r => r.firstYear), 0.5))}, range ${k(pct(R.map(r => r.firstYear), 0))} to ${k(pct(R.map(r => r.firstYear), 1))}`);
  console.log(`  median net worth: ` + yrs.map(y => `${y} ${med(y)}`).join(' · '));
  if (+(process.env.END || 1915) >= 1919) { const ws = R.reduce((a, r) => a + r.warShips, 0), wl = R.reduce((a, r) => a + r.warLost, 0), rl = R.reduce((a, r) => a + r.warReqLost, 0); if (ws) console.log(`  war losses: ${wl} sunk trading and ${rl} on war service, of ${ws} ships in the fleets during the war (1 in ${Math.round(ws / Math.max(1, wl + rl))})`); }
  if (process.env.DEBUG === '5') R.forEach(r => r.sunk.forEach(x => console.log('SUNK', x)));
  if (process.env.DEBUG === '4') R.forEach(r => console.log('game', r.byYear[1914], r.byYear[1919], r.ships, r.trace.filter(t => /January 19(14|16|18|19)/.test(t)).join(' | ')));
  if (+(process.env.END || 1915) >= 1919) { const g = R.filter(r => r.byYear[1914] > 0 && r.byYear[1919] !== undefined).map(r => r.byYear[1919] / r.byYear[1914]); if (g.length) console.log(`  war growth, net worth January 1919 over January 1914: median ${pct(g, 0.5).toFixed(1)}x in the money of the day, ${(pct(g, 0.5) / 2.24).toFixed(1)}x at 1914 prices`);  const g2 = R.filter(r => r.byYear[1914] > 0 && r.adj1919 !== null).map(r => r.adj1919 / r.byYear[1914]); if (g2.length) console.log(`  the same with ships at their pre-war worth (over prices): ${(pct(g2, 0.5) / 2.24).toFixed(1)}x at 1914 prices`); }
  console.log(`  final net worth: p10 ${k(pct(R.map(r => r.final), 0.1))} · median ${k(pct(R.map(r => r.final), 0.5))} · p90 ${k(pct(R.map(r => r.final), 0.9))}`);
  if (+(process.env.END || 1915) >= 1921) { const s14 = R.filter(r => r.byYear[1914] > 0), ok = s14.filter(r => r.bust === null), fy = y => { const v = ok.map(r => r.fleetY[y]).filter(v => v !== undefined); return v.length ? pct(v, 0.5) : '-'; };
    console.log(`  handover: ${ok.length} of ${s14.length} lines solvent in 1914 still trading at the end; their median fleet ` + [1914, 1919, 1920, 1921, 1922].map(y => `${y} ${fy(y)}`).join(' · ') + `; net worth 1921 over 1920 median ${(pct(ok.filter(r => r.byYear[1920] > 0 && r.byYear[1921] !== undefined).map(r => r.byYear[1921] / r.byYear[1920]), 0.5) || 0).toFixed(2)}`); }
  console.log(`  fleet at end (median): ${pct(R.map(r => r.ships), 0.5)} · rate wars per game: ${(R.reduce((a, r) => a + r.wars, 0) / n).toFixed(1)} · reputation ${pct(R.map(r => r.rep), 0.5)} · emergencies per game ${(R.reduce((a, r) => a + r.emerg, 0) / n).toFixed(1)}, ships lost ${(R.reduce((a, r) => a + r.lost, 0) / n).toFixed(2)}`);
  console.log(`  avg profit by route over game: ` + Object.entries(routes).sort((a, b) => b[1] - a[1]).map(([q, v]) => `${q} ${k(v)}`).join(' · '));
}
const [, , only, nArg] = process.argv;
const n = +nArg || 20;
const t0 = Date.now();
for (const s of only ? [only] : ['idle', 'cautious', 'careful', 'advisor', 'expander', 'prudent', 'office', 'undercutter', 'liverpool']) report(s, n);
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)}s)`);
