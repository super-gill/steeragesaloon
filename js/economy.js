/* ================= THE ECONOMY =================
   Prices that rise over the decades, panics that ruin the careless, the tax man, the unions, the combine of rival
   lines that forms against a line grown too big, and the aeroplane, which takes a slice of the express trade but is
   held to a slice by the setting's rules.
   The price level S.pi starts at 1 in 1921. Wages, coal, dues, yard work, ships, shore property and the line rates
   all follow it. Cash in the bank does not: money left idle loses its value; ships and property keep theirs. */
const PX=()=>(typeof S!=='undefined'&&S&&S.pi)||1;
// the tables as written, in 1921 pounds. Shore property is dearer than it was: piers and agencies are big undertakings
const PX0={ref:{},adv:ADV_COST.slice(),maint:MAINT_COST.slice(),pier:{},agency:{},dept:{},prov:{...PROV},comm:{}};
for(const k in ROUTES)PX0.ref[k]={...ROUTES[k].ref};
for(const k in PIER_COST)PX0.pier[k]=PIER_COST[k]*2.5;
for(const k in AGENCY)PX0.agency[k]=AGENCY[k].cost*2;
for(const k in DEPTS)PX0.dept[k]=DEPTS[k].cost;
for(const k in COMM)PX0.comm[k]=COMM[k].rate;
function applyPrices(){
  const p=PX();
  for(const k in ROUTES)for(const c in PX0.ref[k])ROUTES[k].ref[c]=Math.max(1,Math.round(PX0.ref[k][c]*p));
  PX0.adv.forEach((v,i)=>ADV_COST[i]=Math.round(v*p));PX0.maint.forEach((v,i)=>MAINT_COST[i]=Math.round(v*p));
  for(const k in PX0.pier)PIER_COST[k]=Math.round(PX0.pier[k]*p/1000)*1000;
  for(const k in PX0.agency)AGENCY[k].cost=Math.round(PX0.agency[k]*p/1000)*1000;
  for(const k in PX0.dept)DEPTS[k].cost=Math.round(PX0.dept[k]*p/100)*100;
  for(const c in PX0.prov)PROV[c]=PX0.prov[c]*p;
  for(const k in PX0.comm)COMM[k].rate=PX0.comm[k]*p;
}
/* monthly: prices creep up, faster as the century goes on, and fall in a slump or a panic */
function inflate(){
  const m=S.m,f=crashF(m);
  if(newCal())S.pi=piAt(m)*(1-0.03*f); // the real price level, year by year; a panic knocks a little off
  else{ // games begun in 1921 before 0.22: flat in the twenties, falling in the slump, two per cent in the thirties, three after
    const k=m-M21,base=k<12?-0.04:k<108?0.008:k<300?0.02:0.03;
    const r=base-0.06*slump(m)-0.05*f+(Math.random()-0.5)*0.01;
    S.pi=(S.pi||1)*(1+r/12);}
  applyPrices();
  // each January the lines revise their tariffs to the price level, and the Morven Line's fares follow
  if(m%12===0&&m>0){const k=S.pi/(S.fareIdx||1);S.fareIdx=S.pi;
    if(Math.abs(k-1)>0.004){for(const rk in S.lines){const f=S.lines[rk].fares;for(const c in f)f[c]=Math.max(1,Math.round(f[c]*k*10)/10);}
      news(`Tariff revision: the Atlantic lines ${k>1?'raise':'cut'} fares ${Math.abs(Math.round((k-1)*1000)/10)}% with the cost of living. The Morven Line's fares follow.`);}}
}
/* ---------- panics ----------
   From the mid-1930s, every decade or so, the City panics. First rumours, then the crash: trade falls away, ship
   values collapse, the bank calls in part of its loans, and sometimes the bank itself fails and takes the Line's cash
   with it. Government stock is safe from a failed bank. An owner who does nothing goes under. */
const BANK_NAME='the Clydesdale and Western Bank';
function crashF(m){ // how hard the panic is biting, 0 to 1
  const c=S.crash;if(!c||c.stage!=='panic'||m<c.panicAt)return 0;
  const k=m-c.panicAt;return k<6?1:Math.max(0,1-(k-6)/Math.max(1,c.rec-6));
}
function crashMod(c,m){const f=crashF(m);return f?1-f*S.crash.depth*{f:1.2,s:1,t:0.8,tt:1}[c]:1;}
const shipMkt=()=>(1-(S.crash&&S.crash.y1907?0.25:0.4)*crashF(S.m))*warShips(S.m); // second-hand ship prices in a panic (the 1907 panic was an American one, and milder here)
function crashMonth(){
  const m=S.m,c=S.crash;
  if(S.call&&m>=S.call.due)callDue();
  if(!c){const since=m-(S.lastCrash||ym(1931,0));if(m<ym(1936,0)||since<96)return;
    if(Math.random()<0.004+Math.min(0.02,(since-96)*0.0004)){
      const bank=Math.random()<0.6;S.crash={stage:'rumour',m0:m,bank,panicAt:m+1+(Math.random()<0.5?1:0),depth:0.3+Math.random()*0.2,rec:24+Math.floor(Math.random()*18)};
      news(bank?`Whispers in the City: ${BANK_NAME}, which keeps the Morven Line's accounts, is said to be badly overextended. Some owners are quietly moving their money into government stock.`
        :'The markets are jittery. Shares have run too far, and the banks are quietly calling in loans. Cautious owners are paying down debt and holding stock.','bad',true);}
    return;}
  if(c.stage==='rumour'&&m>=c.panicAt){c.stage='panic';panic(c);return;}
  if(c.stage==='panic'&&m>=c.panicAt+c.rec){S.crash=null;S.lastCrash=m;news('Trade has recovered from the panic. The banks are lending again and ships are fetching fair prices.','good',true);}
}
function panic(c){
  const m=S.m;
  news(`Black ${MONTHS[m%12]}. Panic on the exchanges in London and New York. Emigrants cancel, first class stays at home, freight is cut, and nobody will pay a fair price for a ship.`,'bad',true);
  if(c.bank){const keep=5000*PX(),lost=Math.round(Math.max(0,S.cash-keep)*0.75);
    if(lost>0){book('crash',-lost);news(`${BANK_NAME[0].toUpperCase()+BANK_NAME.slice(1)} has closed its doors. The liquidators will pay about five shillings in the pound. The Morven Line loses ${fmt(lost)}.`,'bad',true);}
    else news(`${BANK_NAME[0].toUpperCase()+BANK_NAME.slice(1)} has closed its doors. The Morven Line had little on deposit.`,'bad',true);}
  if(S.debt>20000*PX()){const amt=Math.round(S.debt*(c.bank?0.25:0.15)*(c.y1907?0.6:1)/100)*100;S.call={amt,due:m+(c.y1907?6:3)};
    news(`${c.bank?'The receivers':'The bank'} call in ${fmt(amt)} of the Morven Line's loans, due by ${monthName(S.call.due)}. There will be no new lending for a year, and interest is up two points.`,'bad',true);}
  S.noLend=m+12;S.rateUp=m+12;
  if(S.gilts>0){const g=Math.round(S.gilts*0.12);S.gilts-=g;news(`Government stock has fallen: the Line's holding is worth ${fmt(g)} less.`,'bad');}
}
/* a called loan falls due: pay it, or the bank sells ships to cover it */
function callDue(){
  const c=S.call;S.call=null;let owe=c.amt;
  const pay=Math.min(owe,Math.max(0,S.cash));if(pay>0){S.cash-=pay;S.debt-=pay;owe-=pay;}
  if(owe<=0){news(`The called loan of ${fmt(c.amt)} is repaid.`,'good');return;}
  // what the account can bear within the overdraft is taken from it; ships are seized only for the rest
  const room=Math.max(0,Math.floor(S.cash+odLimit()*0.8)),od=Math.min(owe,room);
  if(od>0){S.cash-=od;S.debt-=od;owe-=od;news(owe>0?`The bank takes ${fmt(od)} of the called loan by overdraft.`:`The called loan of ${fmt(c.amt)} is met, ${fmt(od)} of it by overdraft. The account is overdrawn.`,'bad',true);}
  if(owe<=0)return;
  const fleet=S.ships.filter(x=>x.state!=='sea'&&x.state!=='repo'&&x.state!=='lost').sort((a,b)=>shipValue(b)-shipValue(a));
  while(owe>0&&fleet.length&&S.ships.length>0){const x=fleet.shift(),v=Math.round(shipValue(x)*0.6);
    S.ships=S.ships.filter(y=>y!==x);if(S.selShip===x.id)S.selShip=S.ships[0]?S.ships[0].id:null;admRepay(x);
    const use=Math.min(v,owe);owe-=use;S.debt-=use;S.cash+=v-use;
    news(`The bank has seized SS ${x.name} and sold her at a forced sale for ${fmt(v)} against the called loan.`,'bad',true);}
  if(owe>0){S.cash-=owe;S.debt-=owe;news(`The rest of the called loan, ${fmt(owe)}, is taken from the account.`,'bad',true);}
}
/* government stock: safe from a failed bank, pays three and a half per cent, falls a little in a panic */
function insMonth(){S.insLoss=(S.insLoss||0)*0.96;} // claims fade from the underwriters' memory over a few years
function giltsMonth(){if(S.gilts>0)book('invest',S.gilts*0.035/12);}
function gilts(buy,amt){
  if(buy){amt=Math.min(amt,Math.floor(Math.max(0,S.cash)));if(amt<=0)return false;S.cash-=amt;S.gilts=(S.gilts||0)+amt;return true;}
  amt=Math.min(amt,S.gilts||0);if(amt<=0)return false;const fee=Math.round(amt*0.005);S.gilts-=amt;S.cash+=amt-fee;return true;
}
/* ---------- the tax man: excess profits over a threshold, each January ---------- */
function taxMonth(net){
  S.yearNet=(S.yearNet||0)+net;
  if(S.m%12!==0)return;const profit=S.yearNet;S.yearNet=0;epdJanuary(profit);if(typeof floatJanuary==='function')floatJanuary(profit);
  const thr=150000*PX();if(S.m<ym(1925,0)||profit<=thr)return;
  const tax=Math.round((profit-thr)*0.3/100)*100;book('tax',-tax);
  news(`Excess profits duty: on ${fmt(profit)} earned last year the Treasury takes ${fmt(tax)}.`,'bad');
}
/* ---------- the unions: a big, rich line gets asked for more ---------- */
const HOME_PORTS=['GLA','LIV','SOU','AVO'];
function unionMonth(){
  const m=S.m,n=S.ships.length;
  if(S.union&&m>=S.union.until){unionAnswer(false,true);return;}
  if(S.union||S.strike||m<ym(1923,6)||n<3||m-(S.lastUnion??S.m0??M21)<24)return;
  const rich=S.lastMonth&&S.lastMonth.net>30000*PX()?1.6:S.lastMonth&&S.lastMonth.net>0?1:0.5;
  if(Math.random()<0.004*Math.pow(n,0.75)*rich){
    const pct=[5,8,10,12][Math.floor(Math.random()*4)];S.union={pct,until:m+1};S.lastUnion=m;
    news(`The National Union of Seamen claims ${pct}% more for Morven Line crews${n>=15?', pointing to the Line\'s profits':''}. They want an answer within the month.`,'bad',true);}
}
function unionAnswer(yes,silent){
  const u=S.union;if(!u)return;S.union=null;
  if(yes){S.wageK=(S.wageK||1)*(1+u.pct/100*0.8);S.ships.forEach(x=>x.morale=Math.min(100,(x.morale||60)+6));
    news(`Agreed: Morven Line crews get ${u.pct}% more on union rates. The fo'c'sle is pleased.`,'good');return;}
  const morale=S.ships.reduce((a,x)=>a+(x.morale||60),0)/Math.max(1,S.ships.length);
  const p=clamp(0.35+(60-morale)/80+S.ships.length/120,0.15,0.9);
  if(Math.random()<p){const d=10+Math.floor(Math.random()*16);S.strike={until:S.t+d};
    news(`${silent?'The union took silence for refusal. ':''}Strike: Morven Line crews walk off in ${HOME_PORTS.map(x=>PN[x]).join(', ')}. Ships in those ports are held for about ${d} days.`,'bad',true);}
  else news(`${silent?'The union took silence for refusal, ':'The claim is refused, '}and the men grumble but sail.`,'');
  S.ships.forEach(x=>x.morale=Math.max(0,(x.morale||60)-(silent?8:5)));
}
function strikeDaily(){
  if(!S.strike)return;if(S.t>=S.strike.until){S.strike=null;news('The seamen\'s strike is over. Ships in the home ports are sailing again.','good');return;}
  for(const sh of S.ships)if(sh.state==='port'&&HOME_PORTS.includes(sh.port))sh.portLeft=Math.max(sh.portLeft,S.strike.until-S.t+0.5);
}
/* ---------- the combine: when the Morven Line outgrows the biggest rival, the rivals gang up ---------- */
function combineMonth(){
  const m=S.m;
  if(S.combine&&m>=S.combine.until){S.combine=null;S.lastCombine=m;news('The combine against the Morven Line has broken up over the division of the spoils.','good',true);return;}
  if(S.combine||m<ym(1929,0)||S.ships.length<10||m-(S.lastCombine??S.m0??M21)<60)return;
  const ours=S.ships.reduce((a,x)=>a+x.grt,0),theirs={};for(const x of S.rships||[])theirs[x.owner]=(theirs[x.owner]||0)+x.grt;
  const big=Math.max(0,...Object.values(theirs));
  if(ours<0.8*big||Math.random()>0.06)return;
  const top=Object.keys(S.lines).map(rk=>[rk,shipsOn(rk).length]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(q=>q[0]);
  S.combine={until:m+18+Math.floor(Math.random()*12),rk:top};
  for(const o of coLive())S.rivals[o].cash+=400000*PX();
  news(`The other Atlantic lines have formed a combine against the Morven Line: pooled funds, new tonnage and fighting rates on ${top.map(k=>ROUTES[k].name).join(', ')}.${S.conf?' The conference has expelled the Morven Line.':''}`,'bad',true);
  S.conf=false;
}
const combineOn=rk=>!!(S.combine&&S.combine.rk.includes(rk));
/* ---------- the aeroplane ----------
   In this history the air never wins the Atlantic, but it takes a slice: airships in the late 1930s until the
   Graf Aurelian burns, flying boats after the war, then jets until the Atlantic Air Conference caps them.
   It takes express first class and the mail, some second, nothing from steerage or cargo. The fastest ships
   hold their first class best. Never more than a quarter of any route's first class. */
const AIR_ROUTE={exp:1,liv:0.8,ham:0.8,gny:0.6,hal:0.4,lha:0.4,stl:0.4,nap:0.5,rpl:0.4};
const AIR_CLASS={f:1,s:0.4,tt:0.15,t:0};
function airLevel(y){
  if(y<1936.4)return 0;
  if(y<1938.35)return 0.1*Math.min(1,(y-1936.4)/1.2);
  if(y<1946)return Math.max(0,0.02-(y-1938.35)*0.01);
  if(y<1954)return 0.1*(y-1946)/8;
  if(y<1958.7)return 0.1+0.06*(y-1954)/4.7;
  if(y<1962.3)return 0.16+0.09*(y-1958.7)/3.6;
  return 0.22;
}
function airShare(rk,c,m){
  if(ROUTES[rk].cruise)return 0;
  const a=airLevel(yearOfM(m))*(AIR_ROUTE[rk]||0.2)*(AIR_CLASS[c]||0);if(!a)return 0;
  const fast=typeof S!=='undefined'&&S.ships&&S.ships.some(x=>x.line===rk&&knotsOf(x)>=26);
  return Math.min(0.25,a*(fast?0.6:1));
}
/* ---------- head office grows faster than the fleet ---------- */
const officeCost=()=>(600+250*S.ships.length+18*Math.pow(S.ships.length,1.6)+(S.conf?350:0))*PX();

/* ---------- ships wear out ----------
   sh.fat is the hull's used-up life, 0 to 100. Every crossing uses some: more at full speed, in a run-down ship, with a
   hard-driving master, in gales and without maintenance. A well-kept ship lasts thirty-five years or more; a thrashed one
   a dozen. Past about half, the yard can no longer bring her back to full condition; later she breaks down and springs
   leaks far more often, costs more to insure and fetches less; at 90 the emigration authorities withdraw her steerage
   certificate. Re-plating buys time, less each time. */
const fatOf=sh=>sh.fat===undefined?clamp((yearNow()-sh.built)*1.8,0,95):sh.fat;
const condCap=sh=>Math.round(95-Math.max(0,fatOf(sh)-45)*0.9);
const fatRisk=sh=>1+Math.max(0,fatOf(sh)-55)/15;
function fatVoyage(sh,lenF){
  const mods=shipMods(sh),c=sh.cond;
  const d=0.1*lenF*SPD_WEAR[sh.speed]*mods.wear*(c<50?1.5:c<70?1.15:1)*[1.3,1,0.8][sh.maint];
  addFat(sh,d);
}
function addFat(sh,d){
  const was=fatOf(sh);sh.fat=clamp(was+d,0,110);
  if(was<75&&sh.fat>=75)news(`Lloyd's surveyor on SS ${sh.name}: her plating is wasting and her frames are tired. She has a few good years left, less if she is driven hard.`,'bad');
  if(was<90&&sh.fat>=90)news(`SS ${sh.name} has lost her emigrant certificate: the authorities will not let her carry steerage. Her insurers want double. She should go to the breakers.`,'bad',true);
  if(was<100&&sh.fat>=100)news(`SS ${sh.name} is worn out. Every crossing now is a gamble with her plates and her people.`,'bad',true);
}
const fatWord=sh=>{const f=fatOf(sh);return f<30?'Sound':f<55?'Sound, showing her years':f<75?'Tired: the yard cannot bring her back to new':f<90?'Worn: surveyors are watching her':f<100?'Worn out: no steerage certificate':'Finished: a danger at sea';};

/* ---------- safety policy: one company-wide decision instead of managing every lifeboat ---------- */
const SAFETY=[
  {name:'Cut corners',desc:'Boat drills when the master remembers. Crew costs 3% less. Worse at every emergency, and the court will notice.',cost:0,crew:0.97,cap:-8,save:-0.08,grave:1.3},
  {name:'Board of Trade rules',desc:'Drills and gear to the regulations, no more.',cost:0,crew:1,cap:0,save:0,grave:1},
  {name:'Exemplary',desc:'Weekly drills, trained boat crews, spare pumps, a safety officer in every ship. Costs money every month; crews fight emergencies better, more people live, and the name is worth more.',cost:150,crew:1,cap:8,save:0.05,grave:0.8}];
const safetyOf=()=>SAFETY[S.safety===undefined?1:S.safety];
const safetyCost=()=>S.ships.reduce((a,x)=>a+x.grt/8000,0)*safetyOf().cost*PX();

/* ---------- the court of inquiry ----------
   Every ship lost or given up is investigated. What the court finds decides the fines, the claims from the families
   and shippers, whether the underwriters pay in full, and how long the Line's name suffers. A well-found, well-run
   ship lost to ice with her people saved costs little; a worn-out, run-down ship on the wrong route costs a fortune. */
function lossRecord(sh,e){
  const rk=sh.legRoute||sh.line,m=S.m%12;
  return {name:sh.name,t:S.t,rk,due:S.t+45+Math.random()*30,dead:(sh.lost&&sh.lost.lost)||0,souls:soulsOf(sh)+crewOf(sh),cond:sh.cond,fat:fatOf(sh),morale:sh.morale||60,
    radio:radioOf(sh),drinker:has(sh,'drinker'),full:sh.speed===2,sea:rk?seaSev(sh,rk,m):0,port:rk?linePorts(rk).some(p=>!portFit(sh,p).ok):false,
    safety:S.safety===undefined?1:S.safety,ignored:e?e.orders.filter(o=>o.by==='master'&&e.canOrder).length:0,kind:e?EMERG[e.k].name.toLowerCase():'foundering',
    grave:e?e.sev===3:false,grt:sh.grt,deck:cwSk(sh,'deck'),watch:nightOn(sh),cover:boatCover(sh),early:newCal()&&S.m<ym(1914,0),dis:!!(e&&e.doom),warned:!!(e&&e.warned),paid:sh.claimPaid!==undefined?sh.claimPaid:Math.round(shipValue(sh))};
}
function queueInquiry(sh,e){(S.inq=S.inq||[]).push(lossRecord(sh,e));}
function inquiryDaily(){
  if(!S.inq||!S.inq.length)return;
  const due=S.inq.filter(q=>q.due<=S.t);if(!due.length)return;S.inq=S.inq.filter(q=>q.due>S.t);
  for(const q of due)inquiry(q);
}
/* what the court finds: each fault adds to the blame */
function blameOf(q){
  const F=[];let blame=0;const add=(w,t)=>{blame+=w;F.push(t);};
  if(q.fat>=90)add(3,'her hull was worn out and she should have gone to the breakers');else if(q.fat>=75)add(1.5,'her hull was tired and past her best');
  if(q.cond<35)add(2.5,'she was dangerously run down');else if(q.cond<50)add(1.2,'she was poorly maintained');
  if(q.sea>(q.early?0.6:0.35))add(1.2,'she was too small for the weather on that route'); // before the war a ship of 4,000 or 5,000 tons was an ordinary Atlantic ship
  if(q.port)add(0.5,'she was too big for some of the ports on her line');
  if(q.morale<40)add(1,'her crew were sullen and badly paid');
  if(q.safety===0)add(1.5,'boat drills had been neglected as company policy');
  if(!q.radio)add(1,'she had no wireless, and help came late');
  if(q.drinker)add(1,'her master drank');
  if(q.deck!==undefined&&q.deck<40)add(0.8,'her lookouts and boat crews were poorly trained');
  if(q.dis&&q.radio&&!q.watch)add(0.5,'her wireless kept no watch at night');
  if(q.full&&q.kind!=='mutiny')add(q.warned?1.5:0.5,q.warned?'she kept her full speed after she had been warned':'she was being driven at full speed');
  if(q.ignored)add(0.8,'the owners gave no orders when her master asked for them');
  if(q.safety===2)blame=Math.max(0,blame-1);
  if(q.grave&&blame<1.5)blame=Math.max(0,blame-0.5); // nobody could have saved her
  return {blame,F};
}
/* censure (blame 4 or more) brings the Board of Trade's inspectors; gross negligence (6 or more, with lives lost) takes
   away the insurance and the limit on claims, and the owners and master are charged. Claims the Line cannot pay end it */
const CENSURE=4,GROSS=6;
function inquiry(q){
  const {blame,F}=blameOf(q),gross=blame>=GROSS&&q.dead>0;
  const p=PX();
  const fine=Math.round(blame*8000*p/100)*100,claims=Math.round(Math.min(q.dead*(250+blame*60)*p*(q.early?0.5:1),gross?Infinity:15*q.grt)*(gross?4:1)/100)*100,recover=Math.round(q.grt*0.4*p/100)*100;
  const clawback=gross?Math.round(q.paid/100)*100:q.fat>=90||q.cond<35?Math.round(q.paid*0.6/100)*100:0;
  const total=fine+claims+recover+clawback;book('legal',-total);
  const rep=Math.round(Math.min(30,blame*3+Math.min(10,q.dead/30)));S.rep=clamp(S.rep-rep,0,100);S.stain=(S.stain||0)+blame*2.5;
  if(blame>=CENSURE)S.bot={until:S.t+730};
  if(gross)S.trial={at:S.t+150+Math.random()*60,name:q.name};
  const verdict=blame<1?`The court of inquiry into the loss of SS ${q.name} finds no fault with her master or owners: a ${q.kind} no one could have prevented.`
    :`The court of inquiry into the loss of SS ${q.name} finds that ${F.slice(0,4).join('; ')}.${gross?' It finds gross negligence. The underwriters refuse to pay and take back what they paid, the claims have no limit, and her owners and master are charged with manslaughter.':blame>=CENSURE?' The Morven Line is censured, and the Board of Trade will inspect the rest of its fleet.':''}`;
  news(`${verdict} Fines ${fmt(fine)}, claims from families and shippers ${fmt(claims)}, wreck and recovery ${fmt(recover)}${clawback?`, and the underwriters recover ${fmt(clawback)} of the insurance${gross?'':' because she was unseaworthy'}`:''}. ${rep?`Reputation −${rep}.`:''}`,blame<1?'':'bad',true);
  (S.inqDone=S.inqDone||[]).unshift({name:q.name,t:S.t,findings:F,blame,total,rep,gross});if(S.inqDone.length>12)S.inqDone.length=12;
  if(gross){S.gross={t:S.t,name:q.name,dead:q.dead,F,total,cover:q.cover};if(netWorth()<0||S.cash<-odLimit())woundUp();}
}
