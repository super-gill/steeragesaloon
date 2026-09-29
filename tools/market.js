#!/usr/bin/env node
/* Steerage & Saloon share market check (stage R2, 0.29).
   Plays the game with no screen from 1900 (the Morven Line kept afloat by a benefactor, as in tools/companies.js),
   runs three broker accounts side by side (preserve, balanced, growth), each opened in January 1901 with the same
   money, and reports:
     - each account against the same money in government stock, at the key years;
     - the shipping share index against what the lines are worth, at the panics and booms;
     - the worst fall of each account in the 1907 panic, the 1921 slump and the 1929 crash.
   Usage:
     node tools/market.js            40 years, 6 seeds
     node tools/market.js 40 12      40 years, 12 seeds
   Pass/fail (printed at the end): the balanced account ends ahead of government stock on average; every account
   loses money at some point in a crash; shipping shares fall below what the lines are worth in the 1921 slump (under 0.95)
   and the 1930s (under 0.9), and recover to within 10% of it afterwards. That an untouched market changes nothing is checked with the
   harness: `MKT=0 node tools/harness.js careful 10` must print the same as `node tools/harness.js careful 10`. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
const YEARS = [1906, 1908, 1913, 1919, 1921, 1923, 1929, 1932, 1936, 1939];

function run(seed, years) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;
    const funds={};let lastM=-1;const snap={},idx={},dd={};
    // three accounts at once: the market pays each its dividends and runs each in turn
    mkPayDiv=function(id,d){if(!(d>0))return;for(const k in funds){const F=funds[k],p=F.pos[id];if(p&&p.n)F.cash+=p.n*d;}if(globalThis.PAS&&PAS.pos[id])PAS.cash+=PAS.pos[id]*d;};
    const base=mkFundMonth;mkFundMonth=function(){const keep=S.ex.fund;for(const k in funds){S.ex.fund=funds[k];base();}S.ex.fund=keep;};
    const open=()=>{mkEnsure();for(const b of ['preserve','balanced','growth']){S.ex.fund=null;const c=S.cash;S.cash=1e9;mkFundOpen('broker');const F=S.ex.fund;F.brief=b;F.skill=0.5;
      const amt=Math.round(5000*PX());S.cash-=amt;F.cash+=amt;F.paidIn+=amt;F.giltEq+=amt;S.cash=c;funds[b]=F;}S.ex.fund=null;};
    while(!S.over&&S.m-S.m0<${years}*12){
      if(S.m!==lastM){lastM=S.m;if(S.cash<20000)S.cash=20000;
        if(S.m===ym(1901,0)){open();const ids=Object.keys(S.ex.cos).filter(id=>!S.ex.cos[id].gone),tot=ids.reduce((a,id)=>a+mkCap(id),0),amt=Math.round(5000*PX());
          globalThis.PAS={pos:Object.fromEntries(ids.map(id=>[id,amt*mkCap(id)/tot/S.ex.cos[id].px])),cash:0,eq:amt};}
        if(globalThis.PAS){const P=PAS;P.cash*=1+0.035/12;P.eq*=1+0.035/12;
          P.v=P.cash+Object.keys(P.pos).reduce((a,id)=>a+P.pos[id]*((S.ex.cos[id]&&!S.ex.cos[id].gone)?S.ex.cos[id].px:0),0);
          if(S.m%12===0&&${JSON.stringify(YEARS)}.includes(YEAR0+S.m/12)){(snap[YEAR0+S.m/12]=snap[YEAR0+S.m/12]||{}).passive=P.v/P.eq;}}
        const y=YEAR0+S.m/12;
        for(const k in funds){const F=funds[k],v=mkFundVal(F);const d=dd[k]=dd[k]||{pk:0};d.pk=Math.max(d.pk,v);const e=y<1912?'1907':y>=1920&&y<1925?'1921':y>=1929&&y<1935?'1930s':null;
          if(e){d[e]=Math.min(d[e]===undefined?9:d[e],v/Math.max(1,d.pk));}}
        if(S.m%12===0&&${JSON.stringify(YEARS)}.includes(y)){snap[y]=snap[y]||{};for(const k in funds)snap[y][k]=mkFundVal(funds[k])/funds[k].giltEq;}
        const I=S.ex&&S.ex.idx[S.ex.idx.length-1];if(I){const y2=Math.floor(YEAR0+S.m/12),q=I[1]/Math.max(1,I[2]);const e=idx[y2]=idx[y2]||{lo:9,hi:0};e.lo=Math.min(e.lo,q);e.hi=Math.max(e.hi,q);}}
      advance(1);
    }
    const end={passive:PAS.v/PAS.eq};for(const k in funds)end[k]=mkFundVal(funds[k])/funds[k].giltEq;
    return {snap,idx,dd,end,to:YEAR0+Math.floor(S.m/12)};
  })()`, ctx);
}
const [, , yA, nA] = process.argv, years = +yA || 40, n = +nA || 6;
const R = []; for (let i = 0; i < n; i++) R.push(run(i + 1, years));
const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length), f2 = v => v.toFixed(2);
console.log(`SHARE MARKET  (${n} runs, ${years} years, to ${R[0].to})`);
console.log('\nBroker accounts against the same money in government stock (1.00 = level):');
console.log('year   preserve  balanced  growth    all shares (held, no fee)');
for (const y of YEARS) { const rows = R.map(r => r.snap[y]).filter(Boolean); if (!rows.length) continue;
  console.log(`${y}   ${['preserve', 'balanced', 'growth', 'passive'].map(k => f2(avg(rows.map(q => q[k]))).padStart(8)).join('  ')}`); }
console.log(`end    ${['preserve', 'balanced', 'growth', 'passive'].map(k => f2(avg(R.map(r => r.end[k]))).padStart(8)).join('  ')}   (range balanced ${f2(Math.min(...R.map(r => r.end.balanced)))} to ${f2(Math.max(...R.map(r => r.end.balanced)))})`);
console.log('\nWorst fall from the account\'s high, in each slump (0.80 = down a fifth):');
for (const e of ['1907', '1921', '1930s']) console.log(`${e.padEnd(6)} ${['preserve', 'balanced', 'growth'].map(k => f2(avg(R.map(r => (r.dd[k] || {})[e] ?? 1)))).join('  ')}`);
console.log('\nShipping shares against what the lines are worth (low to high in the year):');
const iy = [1907, 1908, 1914, 1919, 1920, 1921, 1922, 1924, 1928, 1929, 1931, 1932, 1934, 1937];
for (const y of iy) { const rows = R.map(r => r.idx[y]).filter(Boolean); if (!rows.length) continue; console.log(`${y}  ${f2(avg(rows.map(q => q.lo)))} to ${f2(avg(rows.map(q => q.hi)))}`); }
const lo21 = avg(R.map(r => (r.idx[1921] || { lo: 1 }).lo)), lo32 = avg(R.map(r => Math.min((r.idx[1931] || { lo: 1 }).lo, (r.idx[1932] || { lo: 1 }).lo)));
const back = avg(R.map(r => (r.idx[1925] || r.idx[1924] || { hi: 1 }).hi)), back2 = avg(R.map(r => (r.idx[1937] || r.idx[1936] || { hi: 1 }).hi));
const lost = ['preserve', 'balanced', 'growth'].every(k => R.some(r => ['1907','1921','1930s'].some(e => (r.dd[k] || {})[e] < 0.97)));
const ok = avg(R.map(r => r.end.balanced)) > 1 && lost && lo21 < 0.95 && lo32 < 0.9 && back > 0.9 && back2 > 0.9;
console.log(`\nbalanced ahead of stock: ${f2(avg(R.map(r => r.end.balanced)))} · every account loses in some slump: ${lost} · shares below worth in 1921 ${f2(lo21)} and 1931-32 ${f2(lo32)} · back by 1925 ${f2(back)} and 1937 ${f2(back2)}`);
console.log(ok ? 'PASS' : 'CHECK: see the figures above');
