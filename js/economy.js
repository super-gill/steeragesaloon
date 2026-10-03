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
  if(PN.QUE)PN.QUE=newCal()&&S.m<ym(1920,0)?'Queenstown':'Cobh'; // renamed in 1920 (0.37.2); the price tables are reset on every load and month, so the name is too
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
  // a fare changed this month is set against this month's line rate: remember the rate, so the January revision moves
  // it with the rate since it was set, not by a whole year's prices (0.35.7; a fare set at the rate in December used to
  // rise by the whole year's inflation in January, and drift off the rate)
  for(const rk in S.lines){const L=S.lines[rk],f=L.fares,R=ROUTES[rk].ref;L.fseen=L.fseen||{...f};L.fref=L.fref||{};
    for(const c in f)if(f[c]!==L.fseen[c]||!L.fref[c]){L.fref[c]=R[c]||0;L.fseen[c]=f[c];}}
  // each January the lines revise their tariffs to the price level, and the Morven Line's fares follow the rates
  if(m%12===0&&m>0){const k=S.pi/(S.fareIdx||1);S.fareIdx=S.pi;
    if(Math.abs(k-1)>0.004){for(const rk in S.lines){const L=S.lines[rk],f=L.fares,R=ROUTES[rk].ref;
        for(const c in f){const kc=L.fref[c]>0&&R[c]>0?R[c]/L.fref[c]:k;f[c]=Math.max(1,Math.round(f[c]*kc*10)/10);L.fref[c]=R[c]||0;L.fseen[c]=f[c];}}
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
const shipMkt=()=>(1-(S.crash&&S.crash.y1907?0.25:0.4)*crashF(S.m))*warShips(S.m)*(newCal()?1-SLUMP_SHIP*slump(S.m):1); // and in the Depression (0.37.2): three tenths off at the trough, as second-hand tonnage went begging // second-hand ship prices in a panic (the 1907 panic was an American one, and milder here)
function crashMonth(){
  const m=S.m,c=S.crash;
  if(S.liq&&m>=S.liq.next){const p=Math.min(S.liq.left,S.liq.per);S.cash+=p;S.liq.left-=p;S.liq.next=m+3;news(`The liquidators of ${BANK_NAME} pay the Line ${fmt(p)}${S.liq.left>1?`; ${fmt(S.liq.left)} is still to come`:', the last of it'}.`,'good');if(S.liq.left<1)S.liq=null;}
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
  // the bank fails (0.37.2): the deposit is frozen; the liquidators pay fifteen shillings in the pound over eighteen months, so a
  // quarter is lost and the rest comes back slowly. Before, three quarters was lost on the day (KI-061)
  if(c.bank){const keep=5000*PX(),dep=Math.round(Math.max(0,S.cash-keep)),lost=Math.round(dep*0.25),back=dep-lost;
    if(dep>0){S.cash-=back;book('crash',-lost);S.liq={left:(S.liq?S.liq.left:0)+back,per:Math.round(((S.liq?S.liq.left:0)+back)/6),next:m+3};
      news(`${BANK_NAME[0].toUpperCase()+BANK_NAME.slice(1)} has closed its doors with ${fmt(dep)} of the Morven Line's money. The liquidators expect to pay fifteen shillings in the pound over eighteen months: ${fmt(lost)} is lost, and ${fmt(back)} will come back a quarter at a time.`,'bad',true);}
    else news(`${BANK_NAME[0].toUpperCase()+BANK_NAME.slice(1)} has closed its doors. The Morven Line had little on deposit.`,'bad',true);}
  if(S.debt>20000*PX()){const amt=Math.round(S.debt*(c.bank?0.25:0.15)*(c.y1907?0.6:1)/100)*100;S.call={amt,due:m+(c.y1907?6:3)};
    news(`${c.bank?'The receivers':'The bank'} call in ${fmt(amt)} of the Morven Line's loans, due by ${monthName(S.call.due)}. There will be no new lending for a year, and interest is up two points.`,'bad',true);}
  S.noLend=m+12;S.rateUp=m+12;
  {const was=S.gilts||0;S.giltShock=(S.giltShock||0)+0.4;giltsMark();if(was>0)news(`Government stock has fallen in the panic: the Line's holding is worth ${fmt(was-S.gilts)} less for now.`,'bad');}
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
    fleetGone(x,'seized',`seized by the bank and sold for ${fmt(v)}`);
    S.ships=S.ships.filter(y=>y!==x);if(S.selShip===x.id)S.selShip=S.ships[0]?S.ships[0].id:null;admRepay(x);
    const use=Math.min(v,owe);owe-=use;S.debt-=use;S.cash+=v-use;
    news(`The bank has seized SS ${x.name} and sold her at a forced sale for ${fmt(v)} against the called loan.`,'bad',true);}
  if(owe>0){S.cash-=owe;S.debt-=owe;news(`The rest of the called loan, ${fmt(owe)}, is taken from the account.`,'bad',true);}
}
/* government stock (0.35.1): Consols, a 2½% stock with no repayment date, so its price moves against interest rates.
   The yield follows the real annual average (FRED series LTCYUKA, from the Bank of England), 2.5% in 1900, 3.4% in 1913,
   5.4% at the 1920 top, 4.4% through the 1920s and 2.9% by 1935. Bought at the yield of the day it pays that yield; when
   yields rise its price falls, and when they fall it rises. A panic adds to the yield for a few months and then fades.
   It is safe if the Line's bank fails. S.giltPar is the stock held, at £100 a unit of par; S.gilts is its value today. */
const GILT_Y={1899:2.38,1900:2.55,1901:2.69,1902:2.68,1903:2.79,1904:2.86,1905:2.81,1906:2.86,1907:3.00,1908:2.93,1909:3.02,
  1910:3.12,1911:3.19,1912:3.32,1913:3.43,1914:3.48,1915:3.86,1916:4.32,1917:4.58,1918:4.43,1919:4.64,1920:5.37,1921:5.20,
  1922:4.39,1923:4.30,1924:4.37,1925:4.44,1926:4.52,1927:4.56,1928:4.47,1929:4.57,1930:4.45,1931:4.40,1932:3.75,1933:3.38,
  1934:3.08,1935:2.90,1936:2.94,1937:3.30,1938:3.41,1939:3.73,1940:3.38,
  // after 1940 (0.37.2): the long yield as it ran, broadly, in a world without the war: cheap money into the 1940s, rising
  // through the 1950s and 60s, the inflation of the 1970s, and down again from the 1990s; filled in year by year below
  1945:3.2,1950:3.6,1955:4.2,1960:5.4,1965:6.4,1970:9.0,1975:14.0,1980:12.0,1985:10.5,1990:10.5,1995:8.0,2000:4.8,2005:4.4,
  2010:4.0,2015:2.5,2020:1.0,2023:4.0,2030:4.5};
(()=>{const ks=Object.keys(GILT_Y).map(Number).sort((a,b)=>a-b);for(let i=1;i<ks.length;i++)for(let y=ks[i-1]+1;y<ks[i];y++)GILT_Y[y]=+(GILT_Y[ks[i-1]]+(GILT_Y[ks[i]]-GILT_Y[ks[i-1]])*(y-ks[i-1])/(ks[i]-ks[i-1])).toFixed(2);})();
const GILT_LAST=2030;
const GILT_COUPON=2.5,GILT_FEE=0.0025;
/* the Bank of England's rate, broadly, year by year (0.38.0; KI-066). The Line borrows at a point and three quarters over
   it, never under 4.5% (a mortgage on ships was good security), and pays a point and a half more on an overdraft; a
   panic adds two. Before, every loan was 6.5% from 1900 to the present, in the cheap money of the 1930s as in 1920.
   After 1939 the world has no war */
const BANK_RATE={1900:3.9,1901:3.7,1902:3.3,1903:3.75,1904:3.3,1905:3.0,1906:4.3,1907:4.9,1908:3.0,1909:3.1,1910:3.7,1911:3.5,1912:3.8,
  1913:4.8,1914:5,1915:5,1916:5.5,1917:5.2,1918:5,1919:5.2,1920:6.7,1921:6.1,1922:3.7,1923:3.5,1924:4,1925:4.6,1926:5,1927:4.65,
  1928:4.5,1929:5.5,1930:3.4,1931:3.9,1932:3,1933:2,1939:2,1945:2,1951:2.5,1955:4.5,1957:7,1960:5,1965:6.5,1970:7,1974:12,1980:16,
  1985:12,1990:14.75,1995:6.6,2000:6,2005:4.6,2008:3,2010:0.5,2020:0.1,2023:5,2030:4};
(()=>{const ks=Object.keys(BANK_RATE).map(Number).sort((a,b)=>a-b);for(let i=1;i<ks.length;i++)for(let y=ks[i-1]+1;y<ks[i];y++)BANK_RATE[y]=+(BANK_RATE[ks[i-1]]+(BANK_RATE[ks[i]]-BANK_RATE[ks[i-1]])*(y-ks[i-1])/(ks[i]-ks[i-1])).toFixed(2);})();
const bankRate=()=>BANK_RATE[clamp(Math.floor(yearNow()),1900,2030)];
const loanRate=()=>Math.max(4.5,bankRate()+1.75)/100+(S.rateUp>S.m?0.02:0);
const odRate=()=>loanRate()+0.015;
/* the yield in a (fractional) year: each year's average taken at mid-year, straight lines between */
function giltYieldAt(y){const a=Math.floor(y-0.5),f=y-0.5-a,k=v=>GILT_Y[clamp(v,1899,GILT_LAST)];return k(a)+(k(a+1)-k(a))*f;}
/* the market does not follow the table exactly (0.37.2; KI-016): a wander of a few tenths of a per cent either side, drawn only
   while the Line holds stock, so a holding's path cannot be known in advance */
const giltYield=()=>Math.max(0.5,giltYieldAt(yearNow())+(S.giltShock||0)+(S.giltNoise||0));
const giltPrice=()=>GILT_COUPON/giltYield()*100; // £ for £100 of stock
function giltsMark(){S.gilts=Math.round((S.giltPar||0)*giltPrice()/100);if(S.gilts<1){S.gilts=0;S.giltPar=0;}}
function insMonth(){S.insLoss=(S.insLoss||0)*0.96;} // claims fade from the underwriters' memory over a few years
function giltsMonth(){S.giltShock=(S.giltShock||0)*0.8;if(S.giltShock<0.01)S.giltShock=0;
  if(S.giltPar>0){const z=Math.sqrt(-2*Math.log(Math.random()||1e-9))*Math.cos(2*Math.PI*Math.random());S.giltNoise=0.9*(S.giltNoise||0)+0.12*z*giltYieldAt(yearNow())/4;}else S.giltNoise=(S.giltNoise||0)*0.5;
  if(S.giltPar>0)book('invest',S.giltPar*GILT_COUPON/100/12);giltsMark();}
function gilts(buy,amt){
  if(buy){amt=Math.min(amt,Math.floor(Math.max(0,S.cash)));if(amt<=0)return false;S.cash-=amt;S.giltPar=(S.giltPar||0)+amt*(1-GILT_FEE)/giltPrice()*100;giltsMark();return true;}
  giltsMark();amt=Math.min(amt,S.gilts||0);if(amt<=0)return false;const all=amt>=S.gilts-1;
  S.giltPar=all?0:S.giltPar*(1-amt/S.gilts);S.cash+=Math.round(amt*(1-GILT_FEE));giltsMark();return true;
}
/* ---------- the tax man: from 1925, tax on profits over an allowance, each January (wartime excess profits duty is epdJanuary) ---------- */
function taxMonth(net){
  S.yearNet=(S.yearNet||0)+net;
  if(S.m%12!==0)return;const profit=S.yearNet;S.yearNet=0;epdJanuary(profit);if(typeof floatJanuary==='function')floatJanuary(profit);
  // a year's loss is carried forward against later profits, as the Income Tax Acts allowed (0.37.2)
  if(S.m>=ym(1925,0)&&profit<0){S.taxLoss=(S.taxLoss||0)-profit;return;}
  const relief=Math.min(S.taxLoss||0,Math.max(0,profit)),taxable=profit-relief;
  // the standard rate on all the year's profit, as companies paid it (0.38.0): before, three tenths of what was over an
  // allowance of £150,000 at 1921 prices, so a small line paid nothing. In this world there is no war after 1939
  if(S.m<ym(1925,0)||taxable<=0){if(S.m>=ym(1925,0))S.taxLoss=(S.taxLoss||0)-relief;return;}
  S.taxLoss=(S.taxLoss||0)-relief;const y=Math.floor(yearOfM(S.m))-1,rate=incomeTaxRate(y);
  const tax=Math.round(taxable*rate/100)*100;if(tax<=0)return;book('tax',-tax);
  news(`Income tax at ${taxRateText(rate)} in the pound: on ${fmt(profit)} earned last year${relief>0?`, less ${fmt(relief)} of earlier losses,`:''} the Inland Revenue takes ${fmt(tax)}.`,'bad'); // not the wartime duty (0.35.7)
}
/* the standard rate of income tax, year by year, as a share of the pound */
const INCOME_TAX={1924:0.225,1925:0.2,1926:0.2,1927:0.2,1928:0.2,1929:0.2,1930:0.225,1931:0.25,1932:0.25,1933:0.25,1934:0.225,1935:0.225,1936:0.2375,1937:0.25,1938:0.275};
const incomeTaxRate=y=>INCOME_TAX[y]!==undefined?INCOME_TAX[y]:y<1924?0.225:0.275;
const taxRateText=r=>{const s=Math.round(r*20*12),sh=Math.floor(s/12),d=s%12;return `${sh}s${d?' '+d+'d':''}`;};
/* ---------- the unions: a big, rich line gets asked for more ---------- */
const HOME_PORTS=['GLA','LIV','SOU','AVO'];
function unionMonth(){
  const m=S.m,n=S.ships.length;
  if(S.union&&m>=S.union.until){unionAnswer(false,true);return;}
  if(S.union||S.strike||m<ym(1923,6)||n<3||m-(S.lastUnion??S.m0??M21)<24)return;
  const rich=(S.lastMonth&&S.lastMonth.net>30000*PX()?1.6:S.lastMonth&&S.lastMonth.net>0?1:0.5)*(1-0.85*slump(m)); // no union asks for more at the bottom of a slump (0.37.2)
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
  const inIt=coLive().filter(o=>S.rships.some(x=>x.owner===o&&top.includes(x.route)));for(const o of inIt)S.rivals[o].cash+=400000*PX(); // the pooled funds go to the lines on the trades it fights (0.37.2; before, to every line)
  news(`The other Atlantic lines have formed a combine against the Morven Line: pooled funds, new tonnage and fighting rates on ${top.map(k=>ROUTES[k].name).join(', ')}.${S.conf?' The conference has expelled the Morven Line.':''}`,'bad',true);
  if(S.conf)S.confLeft=m;S.conf=false; // expelled: the conference will not have it back for a year, nor while the combine lasts (0.37.2)
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
/* head office (0.36.5): a base, each ship by her tonnage, each line open (agents and an office at both ends) and each port
   the fleet calls at; and, past a dozen ships, the friction of running a big fleet from one office, which the departments
   take off: each one the Line keeps cuts a fifth of it. In 1921 pounds a month: one ship of 4,600 tons on one line about
   £920 (the same as before); ten ships of 6,000 tons on three lines about £3,500; seventy of 8,000 tons on eight lines
   about £39,000 with no departments and £25,000 with all four. Before, a hull cost the same whatever her size. */
function officeParts(){const n=S.ships.filter(x=>x.state!=='lost').length,tons=S.ships.reduce((a,x)=>a+(x.state!=='lost'?x.grt:0),0),lines=Object.keys(S.lines).length;
  const ports=new Set();for(const rk in S.lines)if(ROUTES[rk])for(const p of ROUTES[rk].calls)ports.add(p);
  const base=500+n*100+tons/1000*20+lines*150+ports.size*40;
  const depts=Object.keys(S.depts||{}).length,fr=0.5*Math.log(1+Math.max(0,n-12)/12)*(1-0.2*Math.min(4,depts));
  return {base,friction:fr,conf:S.conf?350:0,n,tons,lines,ports:ports.size,depts};}
const officeCost=()=>{const o=officeParts();return (o.base*(1+o.friction)+o.conf)*PX();};

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
/* ---------- rescue (0.37.0) ----------
   When the bank forecloses, the Line is usually rescued rather than wound up, as Royal Mail was reconstructed in 1931 and
   Cunard carried through the 1930s on a Treasury loan. Once only: a second failure is final. The rescuer depends on the
   era and the Line:
   - the Treasury, from 1921, for a Line that matters to the country (an Admiralty-subsidised ship, a mail contract, or
     40,000 tons afloat): a loan at 3.5% and a quarter of the Line, with a government director who will not let ships be
     sold until the loan is repaid; no dividend until then;
   - a rival line with the cash: two fifths of the Line for its money, no loan; the Line may not raid it;
   - otherwise a consortium of banks: a loan at 7%, no dividend, and no ships bought or built until half is repaid; the
     mortgage holders write off a quarter of their loans (as Royal Mail's debenture holders did in 1932).
   Whoever rescues it, the bank reschedules the Line's mortgages: no repayment for three years (rescueMoratorium).
   The chance of a rescue rises with the Line's standing and with how far its ships cover what it owes. The rescuer's
   share is the owner's no longer: the owner's own stake (ownerShare) is what the game's score counts from then on. */
const RESCUE_BY={bank:'a consortium of the City banks',treasury:'the Treasury'};
function rescueNeed(){return Math.max(0,-S.cash)+6*runningCost();}
function rescueChance(){if(S.rescue||!S.ships.length)return 0;const owe=S.debt+Math.max(0,-S.cash),cover=(fleetValue()/(newCal()?1-SLUMP_SHIP*slump(S.m):1)+shoreValue())/Math.max(1,owe); // ships at their normal worth, as the banks judge them in the Depression (0.37.2)
  return clamp(0.72+0.005*(S.rep-40)+(cover>=1.2?0.15:cover>=0.8?0:-0.2),0.15,0.92);}
function rescueWho(need){
  const tons=S.ships.reduce((a,x)=>a+x.grt,0),national=S.ships.some(x=>x.adm)||Object.keys(S.mail||{}).length>0||tons>=40000;
  if(S.m>=ym(1921,0)&&national)return {kind:'treasury'};
  const rich=coLive().filter(o=>!RIVAL_P[o].kind&&!(typeof trustMember==='function'&&trustMember(o))&&S.rivals[o]&&S.rivals[o].cash>=need*1.5).sort((a,b)=>S.rivals[b].cash-S.rivals[a].cash)[0];
  if(rich&&Math.random()<0.5)return {kind:'rival',o:rich};
  return {kind:'bank'};}
/* before it forecloses, the bank sells what it holds as security and can sell in a day: government stock, the investment
   account and shares. A Line that is short of cash but rich in stock is not insolvent, and is not rescued (0.37.2) */
function bankRealise(){const want=()=>-odLimit()*0.5-S.cash;let sold=0;const c0=S.cash;
  if(want()>0&&(S.gilts||0)>0){gilts(false,Math.min(S.gilts,want()+50000*PX()));}
  if(want()>0&&S.ex&&S.ex.fund&&typeof mkFundTake==='function')mkFundTake(want()+50000*PX(),false);
  if(want()>0&&S.ex&&S.ex.me)for(const o of Object.keys(S.ex.me.pos||{})){if(want()<=0)break;if(typeof mkSell==='function')mkSell(o,1);}
  sold=S.cash-c0;if(sold>0)news(`The bank, finding the Line's account far overdrawn, sells ${fmt(sold)} of its stock and shares to cover it.`,'bad',true);
  return S.cash>=-odLimit();}
function rescueTry(){
  if(S.rescue){news('The bank forecloses. Having been rescued once, the Morven Line finds no one to rescue it again.','hist',2);return false;}
  if(Math.random()>=rescueChance())return false;
  const need=Math.round(rescueNeed()/1000)*1000,w=rescueWho(need),R={kind:w.kind,o:w.o||null,m:S.m,need,stake:0,loan:0,loan0:0,rate:0};
  if(w.kind==='treasury'){Object.assign(R,{stake:0.25,loan:need,loan0:need,rate:0.035,veto:true,noDiv:true});}
  else if(w.kind==='rival'){Object.assign(R,{stake:0.4});S.rivals[w.o].cash-=need;}
  else{Object.assign(R,{loan:need,loan0:need,rate:0.07,noDiv:true,noBuy:true});
    // the mortgage holders write off only what their security will not cover, and never more than a quarter (0.37.2)
    const short=S.debt+Math.max(0,-S.cash)-0.8*(fleetValue()+shoreValue());R.cut=Math.round(clamp(short,0,0.25*S.debt));S.debt-=R.cut;}
  S.cash+=need;S.call=null;S.rescue=R;S.rep=clamp(S.rep-10,0,100);if(R.loan>0)S.noLend=Math.max(S.noLend||0,S.m+1); // the banks lend nothing more while the rescue is owed
  const by=w.kind==='rival'?RIVALS[w.o].name:RESCUE_BY[w.kind];
  news(`The Morven Line is rescued. ${by[0].toUpperCase()+by.slice(1)} puts up ${fmt(need)}${R.stake?` for ${Math.round(R.stake*100)}% of the Line`:''}${R.loan?`${R.stake?', as a loan at ':' as a loan at '}${(R.rate*100).toFixed(1)}%`:''}.${R.cut?` The mortgage holders write off ${fmt(R.cut)}, a quarter of what the Line owes them.`:''} ${rescueTerms(R)} The bank puts off repayments on its mortgages for three years. A second failure will be final.`,'hist',2);
  return true;}
function rescueTerms(R){const t=[];if(R.noDiv&&R.loan>0)t.push('no dividend until the loan is repaid');if(R.veto&&R.loan>0)t.push('a government director who will not let a ship be sold until then');
  if(R.noBuy&&R.loan>R.loan0*0.5)t.push('no ship bought or built until half the loan is repaid');if(R.kind==='rival')t.push(`no raids on ${RIVALS[R.o].name}, which now holds ${Math.round(R.stake*100)}% of the Line`);
  return t.length?`The terms: ${t.join('; ')}.`:'';}
/* monthly: interest on the rescue loan, and a quarter of any surplus over three months' running costs to repay it */
function rescueMonth(){const R=S.rescue;if(!R||!(R.loan>0))return;book('interest',-R.loan*R.rate/12);S.noLend=Math.max(S.noLend||0,S.m+1);
  const spare=S.cash-3*runningCost();if(spare>0){const p=Math.min(R.loan,Math.round(spare*0.25));S.cash-=p;R.loan-=p;
    if(R.loan<1){R.loan=0;news(`The Line has repaid its rescue loan to ${R.kind==='treasury'?'the Treasury':'the banks'}. ${R.stake?`${R.kind==='treasury'?'The Treasury':R.kind==='rival'?RIVALS[R.o].name:'The rescuer'} keeps its ${Math.round(R.stake*100)}% of the Line.`:'The restrictions are lifted.'}`,'good',true);}}}
/* what the rescue still forbids */
const rescueNoSale=()=>!!(S.rescue&&S.rescue.veto&&S.rescue.loan>0);
const rescueNoBuy=()=>!!(S.rescue&&S.rescue.noBuy&&S.rescue.loan>S.rescue.loan0*0.5);
const rescueFriend=o=>!!(S.rescue&&S.rescue.kind==='rival'&&S.rescue.o===o);
const rescueMoratorium=()=>!!(S.rescue&&S.m<S.rescue.m+36);
const rescueNoDiv=()=>!!(S.rescue&&S.rescue.noDiv&&S.rescue.loan>0);
/* the owner's own share of the Line: after a rescuer's stake and any public float */
const ownerShare=()=>(1-((S.rescue&&S.rescue.stake)||0))*(S.fl&&S.fl.n?S.fl.own/S.fl.n:1);
