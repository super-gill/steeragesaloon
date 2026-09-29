#!/usr/bin/env node
/* Steerage & Saloon outside work check.
   Gives the Morven Line a full shore establishment (piers, a yard, hostels, every agency and canvasser),
   plays the given years headless, and prints what each place would earn a month from other lines
   every January, against what it costs to run and to buy. With "sell" it switches every place to
   selling and also prints what the rival lines gained and how the Morven Line's own ships did.
   Usage:
     node tools/outside.js [years] [seeds] [sell]     default 15 years, 4 seeds, own use only */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice', 'times'].map(f => path.join(ROOT, 'js', f + '.js'));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed, years, sell) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;S.cash+=2e6;
    for(const [k,v] of [['pier','LIV'],['pier','GLA'],['pier','NYC'],['pier','HAL'],['yard','GLA'],['hostel','LIV'],['hostel','GLA'],['agency','british'],['agency','americas'],['agency','continent'],['agency','med'],['fagent','british'],['fagent','americas'],['fagent','africa']])doAction('shorebuy',[k,v]);
    if(${sell})for(const key of outKeys())doAction('shoresell',[key,1]);
    const rows=[];let last=-1,own=0,ownN=0;
    while(!S.over&&S.m-S.m0<${years}*12){if(S.m!==last){last=S.m;if(S.cash<20000)S.cash=20000;
      if(S.lastMonth&&S.lastMonth.m>S.m0){own+=(S.lastMonth.cat.fares||0)+(S.lastMonth.cat.cargo||0);ownN++;}
      if(S.m%12===0&&S.m>S.m0){const r={y:YEAR0+S.m/12};for(const key of outKeys())r[key]=(S.shore.est[key]||{}).gross||0;
        r.rivalCash=coAll().reduce((a,c)=>a+c.cash,0);rows.push(r);}}
      advance(1);}
    const cost={};for(const key of outKeys()){const [k,v]=key.split(':');cost[key]={buy:shoreCost(k==='fagent'?'fagent':k==='agency'?'agency':k,v),run:({pier:350,yard:800,hostel:250,agency:300,fagent:500})[k]*PX()};}
    return {rows,cost,own:own/Math.max(1,ownN),earned:Object.fromEntries(outKeys().map(k=>[k,outYear(k)]))};
  })()`, ctx);
}
const [, , yA, nA, sA] = process.argv, years = +yA || 15, n = +nA || 4, sell = sA === 'sell';
const R = []; for (let i = 0; i < n; i++) R.push(run(i + 1, years, sell));
const keys = Object.keys(R[0].cost), k = v => '£' + Math.round(v).toLocaleString('en-GB');
console.log(`OUTSIDE WORK  (${n} runs, ${years} years, ${sell ? 'selling everything' : 'own use only, estimates'})`);
console.log('What each place would earn a month from other lines, averaged over the runs, each January:');
console.log('year  ' + keys.map(q => q.padStart(16)).join(''));
for (const row of R[0].rows) { const y = row.y; console.log(y + '  ' + keys.map(q => k(R.reduce((a, r) => a + ((r.rows.find(x => x.y === y) || {})[q] || 0), 0) / n).padStart(16)).join('')); }
console.log('\nrunning a month ' + keys.map(q => k(R[0].cost[q].run).padStart(16)).join(''));
console.log('to buy          ' + keys.map(q => k(R[0].cost[q].buy).padStart(16)).join(''));
console.log(`\nMorven Line fares and cargo, average month: ${k(R.reduce((a, r) => a + r.own, 0) / n)}`);
if (sell) console.log('earned in the final year: ' + keys.map(q => `${q} ${k(R.reduce((a, r) => a + r.earned[q], 0) / n)}`).join(' · '));
