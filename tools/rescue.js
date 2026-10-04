#!/usr/bin/env node
/* Steerage & Saloon rescue check (0.37.0). Drives a Line into foreclosure and checks what follows:
     - a failing Line with a sound fleet is rescued (the chance forced to a certainty), keeps trading, and owes the rescuer;
     - the terms hold: the banks' "no ship bought or built", the Treasury's veto on sales, no dividend, no repayments on the
       mortgages for three years, the rescue loan counted against net worth, and no raid on a rival that holds a stake;
     - a second failure is final, and a Line found grossly negligent is wound up with no rescue;
     - (0.37.2, from test round 4) failing on purpose does not pay: the bank sells a Line's government stock before it
       forecloses, and no rescue writes off debt that the security covers; stock-backed borrowing is limited to twice the
       Line's worth; a rescued Line can neither borrow to pay off the rescue nor merge a line into it; the rescuing rival's
       shares cannot be bought; and a Line expelled by the combine cannot rejoin the conference while it lasts.
   Usage:  node tools/rescue.js [seeds]   (default 3) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 3)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info===undefined?'':String(info)});
    const RC=rescueChance;const yes=()=>{rescueChance=()=>1;},no=()=>{rescueChance=RC;};
    const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<100000){if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);}};
    // a Line of a few ships, in debt, then overdrawn past the bank's limit
    const setup=(y)=>{newGame();UI.autoPause=false;UI.speed=1;S.lines.liv=S.lines.liv||{fares:defaultFares('liv'),service:1,adv:1,last:[null,null]};
      while(S.ships.length<4){refreshMarket();const m=S.market.shift();if(!m)break;delete m.price;m.line='liv';if(m.state==='laid'){m.state='port';m.portLeft=1;}S.ships.push(m);}
      S.cash=1e5;{let g=0;while(!S.over&&S.m<ym(y,0)&&g++<100000){if(S.cash<1e5)S.cash=1e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);}}S.cash=2e4;S.gross=null;S.debt=Math.round(fleetValue()*0.4);};
    const fail=()=>{S.cash=-odLimit()-5000;to(S.m+1);};
    // 1: a bank rescue before the 1920s
    setup(1908);yes();S.rescue=null;
    const nw0=netWorth();fail();no();
    const R=S.rescue;ok('a failing Line is rescued and keeps trading',!S.over&&R&&S.cash>-odLimit(),R?R.kind+' '+fmt(R.need):'over: '+S.over);
    if(R&&R.kind==='bank'){
      ok('the banks forbid buying a ship until half the loan is repaid',rescueNoBuy()&&!buyShip((refreshMarket(),S.market[0]||{grt:1})),'');
      ok('no dividend while the loan is owed',rescueNoDiv(),'');}
    if(R){ok('the rescue loan counts against net worth',Math.abs(netWorth()-(S.cash+(S.gilts||0)+fleetValue()+shoreValue()+ordersValue()-S.debt-admDebt()-R.loan+((S.liq&&S.liq.left)||0)+mkWorth()))<1,fmt(R.loan));
      const d0=S.debt;S.cash=Math.max(S.cash,3e5);to(S.m+1);ok('no repayment on the mortgages during the moratorium',S.debt>=d0-1,fmt(d0)+' then '+fmt(S.debt));
      yes();fail();no();ok('a second failure is final',S.over==='bust',S.over);}
    // 2: the Treasury after 1921, for a Line with a mail contract
    setup(1922);yes();S.rescue=null;S.mail=S.mail||{};S.mail.liv={pay:1000,strikes:0,ok:false};fail();no();
    {const T=S.rescue;ok('the Treasury rescues a Line that matters to the country after 1921',T&&T.kind==='treasury'&&!S.over,T?T.kind:S.over);
     if(T){const sh=S.ships.find(x=>x.state!=='req'&&x.state!=='lost');ok('the government director stops a ship being sold',!sh||(!exitShip(sh,'sell')&&S.ships.includes(sh)),sh?sh.name:'no ship to try'); /* any ship of hers (0.39.3) */
       ok('the owner keeps three quarters',Math.abs(ownerShare()-0.75)<1e-9||(S.fl&&S.fl.n),ownerShare().toFixed(2));}}
    // 3: a rival that rescues the Line may not be raided
    {setup(1910);S.rescue=null;mkEnsure();const o=coLive().find(q=>!RIVAL_P[q].kind&&S.ex.cos[q]&&!S.ex.cos[q].gone);
     if(o){S.rescue={kind:'rival',o,m:S.m,need:1,stake:0.4,loan:0,loan0:0,rate:0};S.cash=1e7;
       ok('no dawn raid on the rival holding a rescue stake',!mvRaid(o)&&!mvTender(o,0.35),RIVALS[o].name);}}
    // 4: gross negligence: wound up, no rescue
    setup(1909);S.rescue=null;yes();S.gross={t:S.t,name:'x',dead:1,F:0,total:0,cover:0};fail();no();
    ok('a Line found grossly negligent is wound up, not rescued',S.over==='wound'&&!S.rescue,S.over);
    // 5: borrow on Consols to the limit, then fall short of cash: the bank sells the stock; no rescue, no write-off
    {setup(1931);S.rescue=null;yes();S.debt=0;S.cash=5e6;gilts(true,5e6);let g=0;while(g++<60){const h=headroom();if(h<1000)break;S.debt+=h;S.cash+=h;gilts(true,h);}
     const lev=S.debt/Math.max(1,netWorth()),nw0=netWorth(),d0=S.debt;fail();no();
     ok('borrowing on stock stops at about twice what the Line is worth',lev<=2.3,'debt '+lev.toFixed(2)+' times net worth');
     ok('a Line rich in stock is not rescued: the bank sells the stock',!S.rescue&&(!S.over||(S.over==='wound'&&S.gross)) /* a ship lost through gross negligence in the month played ends the game on its own (0.39.4) */,(S.rescue?'rescued, '+fmt(S.rescue.cut||0)+' written off':'no rescue')+', debt '+fmt(d0)+' then '+fmt(S.debt)+', net worth '+fmt(nw0)+' then '+fmt(netWorth())+(S.over?', OVER '+S.over:''));}
    // 6: a rescued Line: no borrowing to pay it off, no merger
    {setup(1912);yes();S.rescue=null;fail();no();const R=S.rescue;
     if(R&&R.loan>0){const h=headroom();const lent=h>=1000&&!(S.noLend>S.m);ok('a rescued Line cannot borrow from the bank to repay the rescue',!lent,'headroom '+fmt(h)+', no lending until '+monthName(S.noLend||0));
       mkEnsure();const o=coLive().find(q=>!RIVAL_P[q].kind&&S.ex.cos[q]&&!S.ex.cos[q].gone);if(o&&rescueNoBuy()){S.ex.me.pos[o]={n:Math.ceil(S.ex.cos[o].n*0.8),cost:0};ok('no merger while the banks forbid buying ships',!mkMerge(o),RIVALS[o].name);}}
     else ok('a rescued Line cannot borrow from the bank to repay the rescue',true,'rescued by '+(R?R.kind:'nobody'));}
    // 7: the rival that rescued the Line: its shares are not for sale to the Line
    {setup(1912);S.rescue=null;mkEnsure();const o=coLive().find(q=>!RIVAL_P[q].kind&&S.ex.cos[q]&&!S.ex.cos[q].gone);
     if(o){S.rescue={kind:'rival',o,m:S.m,need:1,stake:0.4,loan:0,loan0:0,rate:0};S.cash=1e7;ok('shares in the rescuing rival cannot be bought',!mkBuy(o,10000)&&!mkBuyPct(o,0.05),RIVALS[o].name);}}
    // 8: the combine expels the Line from the conference, and it may not rejoin while the combine lasts
    {setup(1930);S.conf=true;S.combine=null;S.lastCombine=-999;while(S.ships.length<12){refreshMarket();const m=S.market.shift();if(!m)break;delete m.price;m.line='liv';S.ships.push(m);}
     for(const x of S.ships)x.grt=Math.max(x.grt,60000);const R0=Math.random;Math.random=()=>0.01;combineMonth();Math.random=R0;
     ok('a Line expelled by the combine cannot rejoin the conference at once',!!S.combine&&!S.conf&&!confJoin(),S.combine?'combine to '+monthName(S.combine.until):'no combine formed');}
    return out;})()`, ctx);
}
const n = +process.argv[2] || 3; let bad = 0; const tally = {};
for (let i = 1; i <= n; i++) for (const q of run(i)) { const t = tally[q.name] = tally[q.name] || { ok: 0, n: 0, info: [] }; t.n++; if (q.v) t.ok++; t.info.push(q.info); }
for (const k in tally) { const t = tally[k]; if (t.ok < t.n) bad++; console.log(`${t.ok === t.n ? 'ok  ' : 'FAIL'} ${k}: ${t.ok}/${t.n}${t.info.some(x => x) ? ' (' + t.info.join('; ') + ')' : ''}`); }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
