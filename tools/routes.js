#!/usr/bin/env node
/* Route economics by year: what a given ship (default the Morven, a liner) would earn per month on each route in
   January and July, as the rivals evolve in an untouched game.
   Usage: node tools/routes.js [seed] [ship name]   e.g. node tools/routes.js 1 "Rio Negro" */
const fs=require('fs'),path=require('path'),vm=require('vm');
const ROOT=path.join(__dirname,'..');
const ctx={console,performance:{now:()=>0},localStorage:{getItem(){return null},setItem(){}}};vm.createContext(ctx);
const seed=+process.argv[2]||1,probeName=process.argv[3]||'Morven';
vm.runInContext(`Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(${seed*7919+13});`,ctx);
for(const f of ['chart-data','data','helpers','economy','lanes','wireless','silent','emergency','ledger','sim','rivals','yard','naval','facilities','crew','state','clock','advice'])vm.runInContext(fs.readFileSync(path.join(ROOT,'js',f+'.js'),'utf8'),ctx);
const out=vm.runInContext(`(function(){newGame();UI.autoPause=false;UI.speed=1;UI.rev=0;
  const probe=makeShip(TEMPL.find(t=>t.name==='${probeName}'),70,'GLA');const rows=[];
  while(!S.over&&S.t<5480){const d=dOf(S.t);if(d.getUTCDate()===15&&(d.getUTCMonth()===0||d.getUTCMonth()===6)){
      const r={when:monthName(S.m)};for(const rk of Object.keys(ROUTES))r[rk]=Math.round(econ(probe,rk).pm/100)*100;
      r.rivals=Object.keys(ROUTES).map(rk=>rk+':'+S.rships.filter(x=>x.route===rk).length).join(' ');rows.push(r);}
    advance(1);}
  return rows;})()`,ctx);
const keys=Object.keys(out[0]).filter(k=>k!=='when'&&k!=='rivals');
console.log('probe: '+probeName);console.log('month           '+keys.map(k=>k.padStart(7)).join(''));
for(const r of out)console.log(r.when.padEnd(16)+keys.map(k=>String(r[k]).padStart(7)).join(''));
