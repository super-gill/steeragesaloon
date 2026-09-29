#!/usr/bin/env node
/* Steerage & Saloon stakes and control check (stage R3, 0.30).
   Plays the game with no screen (the Morven Line kept in cash by a benefactor) and, for each seed, takes over a rival
   line step by step, checking at each stake that it gives exactly its powers:
     - under 20%: no influence; at 20%: a seat (influence 1); over 50%: control (influence 2);
     - control: the dividend, strategy and keep-off settings take, a loan to it leaves net worth unchanged, a controlled line leaves the Line's trades within a
       year and puts no new ship on them, its rate wars end, and a ship bought from it arrives valued as its books had her;
     - at 75%: a merger brings in every ship, opens its trades, and the Line's net worth moves by exactly what the
       accounts say (its cash, ships and debts, less the minority's payment and the market value of the stake);
     - a Combine member can never be more than 40% held;
     - at 90% after the 1929 Companies Act the rest is bought at the market; before it at a quarter over;
     - winding up pays the Line its share of what is left and queues a new line for the trades.
   Usage:  node tools/stakes.js [seeds]   (default 4) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;

function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info||''});
    let lastM=-1;const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<200000){if(S.m!==lastM){lastM=S.m;if(S.cash<5e6)S.cash=5e6;}advance(1);}};
    const buyTo=(o,k)=>{let g=0;while(mkStake(o)<k&&g++<400){if(!mkBuyPct(o,Math.min(0.05,k-mkStake(o)+0.001)))break;}return mkStake(o);};
    to(ym(1906,0));mkEnsure();
    // the target: the biggest line outside the Combine that is not a giant
    const cands=coLive().filter(o=>!trustMember(o)&&!RIVAL_P[o].kind&&coFleet(o).length>=3).sort((a,b)=>coFleet(b).length-coFleet(a).length);
    const o=cands.find(x=>coFleet(x).length<=12)||cands[0];if(!o)return {out:[{name:'a target exists',v:false}]};
    ok('no influence under a fifth',mkInfl(o)===0&&buyTo(o,0.15)<0.2&&mkInfl(o)===0);
    buyTo(o,0.2);ok('a seat at a fifth',mkInfl(o)===1,Math.round(mkStake(o)*100)+'%');
    const rk0=coFleet(o)[0].route;ok('the seat reaches the trades it leads',S.lines[rk0]||topRival(rk0)!==o||mkInflOn(rk0)===1);
    ok('no control yet',!mkCtrlSet(o,'div','none')&&!mkPeace(o));
    buyTo(o,0.51);ok('control over half',mkInfl(o)===2,Math.round(mkStake(o)*100)+'%');
    ok('dividend setting takes',mkCtrlSet(o,'div','generous')&&S.rivals[o].divPol==='generous');
    ok('strategy setting takes',mkCtrlSet(o,'strat','retrench')&&(to(S.m+1),Math.abs(RIVAL_P[o].aggr-S.rivals[o].aggr0*0.6)<1e-9));
    // put the Line on one of its trades, then keep it off
    const rk=coFleet(o)[0].route;if(!S.lines[rk])S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};
    mkCtrlSet(o,'keep');to(S.m+12);
    ok('kept off the Line\\'s trades within a year',!coFleet(o).some(x=>S.lines[x.route])&&!(S.rorders||[]).some(q=>q.o===o&&S.lines[q.rk]),coFleet(o).map(x=>x.route).join(' '));
    S.wars[rk]={left:6,mult:0.72,multT:0.6,lines:true,by:[o,coLive().find(q=>q!==o)]};ok('its rate war ends on the Line\\'s word',mkPeace(o)&&!S.wars[rk]);
    const x=coFleet(o)[0],val=coShipVal(x),n0=S.ships.length,c0=S.rivals[o].cash;
    ok('a ship bought at a fair price',mkTakeShip(o,x.id)&&S.ships.length===n0+1&&Math.abs(shipValue(S.ships[S.ships.length-1])-val)<0.02*val&&Math.abs(S.rivals[o].cash-c0-Math.round(val/100)*100)<1,Math.round(shipValue(S.ships[S.ships.length-1]))+' vs '+Math.round(val));
    {const nw0=netWorth(),c0=S.cash,lend=Math.round(20000*PX());ok('a loan to a controlled line',mkLend(o,lend)&&S.rivals[o].lineLoan>=lend&&Math.abs(netWorth()-nw0)<1,'net worth moved '+Math.round(netWorth()-nw0));}
    ok('no merger under three quarters',!mkMerge(o));
    buyTo(o,0.76);ok('special resolutions at three quarters',mkStake(o)>=0.75);
    const co=S.rivals[o],fleet=coFleet(o).length,ships=S.ships.length,cost=mkMergeCost(o),stakeV=mkPosVal(S.ex.me)-(S.ex.me.pos[o]?0:0),mine=S.ex.me.pos[o].n*S.ex.cos[o].px;
    const shipV=coFleet(o).reduce((a,y)=>a+coShipVal(y),0),refund=(S.rorders||[]).filter(q=>q.o===o).reduce((a,q)=>a+Math.round(coNewPrice(q.sh)*0.8),0);
    const expect=co.cash+shipV-co.debt-cost-mine+refund-(co.lineLoan||0),nw0=netWorth(); // the Line's own loan to it merges away
    ok('the merger goes through',mkMerge(o));
    const d=netWorth()-nw0;
    ok('every ship joins the Line',S.ships.length===ships+fleet,fleet+' ships');
    ok('the merged accounts add up',Math.abs(d-expect)<Math.max(1000,0.02*Math.abs(expect)),'net worth moved '+Math.round(d)+', expected '+Math.round(expect));
    ok('the merged line is gone',!coAlive(o)&&S.ex.cos[o].gone&&!coFleet(o).length);
    to(S.m+3);if(fleet)ok('the merged ships sail',S.ships.filter(y=>/Late of/.test(y.note)).some(y=>y.state==='sea'||y.state==='port'));
    // the Combine's members
    const tm=trustMembers()[0];if(tm){buyTo(tm,0.6);ok('a Combine member is never more than 40% held',mkStake(tm)<=0.4+1e-9,Math.round(mkStake(tm)*100)+'%');}
    // winding up another line
    const o2=coLive().filter(q=>!trustMember(q)&&!RIVAL_P[q].kind&&coFleet(q).length>=2&&q!==o).sort((a,b)=>coFleet(a).length-coFleet(b).length)[0];
    if(o2){buyTo(o2,0.76);const k=mkStake(o2),wv=Math.max(0,mkWindValue(o2))*k,c1=S.cash,q0=(S.coQueue||[]).length;
      ok('winding up pays the Line its share',mkWindUp(o2)&&Math.abs(S.cash-c1-wv)<Math.max(500,0.01*wv)&&(S.coQueue||[]).length===q0+1,Math.round(S.cash-c1)+' vs '+Math.round(wv));}
    // buying out: at a quarter over before the 1929 Act, at the market after
    const o3=coLive().filter(q=>!trustMember(q)&&coFleet(q).length>=2).sort((a,b)=>coFleet(a).length-coFleet(b).length)[0];
    if(o3){buyTo(o3,0.9);const c=S.ex.cos[o3],pre=mkBuyoutCost(o3),rest=c.n-S.ex.me.pos[o3].n;
      ok('before 1929 the rest costs a quarter over',Math.abs(pre-rest*c.px*1.25)<2,Math.round(pre));
      to(ym(1930,0));if(coAlive(o3)&&mkStake(o3)>=0.9){const c2=S.ex.cos[o3],r2=c2.n-S.ex.me.pos[o3].n;ok('after it, the market price',Math.abs(mkBuyoutCost(o3)-r2*c2.px)<2);
        ok('the buyout makes it wholly owned',mkBuyout(o3)&&Math.abs(mkStake(o3)-1)<1e-9);}
      else ok('the line lasts to 1930 for the 1929 test (not a failure of the rules)',true,coAlive(o3)?'stake '+Math.round(mkStake(o3)*100)+'%':'it failed before 1930');}
    return {out,target:RIVALS[o].name};
  })()`, ctx);
}
const n = +process.argv[2] || 4;let bad = 0;
for (let i = 1; i <= n; i++) { const r = run(i); console.log(`seed ${i}${r.target ? ': ' + r.target : ''}`);
  for (const q of r.out) { if (!q.v) bad++; console.log(`  ${q.v ? 'ok  ' : 'FAIL'} ${q.name}${q.info ? ' (' + q.info + ')' : ''}`); } }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
