/* ================= RIVAL COMPANIES ================= */
/* Each rival line is a company with a balance sheet: cash in the bank, a fleet with a value, and money borrowed
   against it. Every month it books what its ships earned from the shared market on each route (the same passengers
   and cargo the Morven Line competes for), less its running costs and interest. It builds when trade is good and the
   money is there, borrows as far as its character allows, repays when it is flush, sells ships when it is short,
   and fails when it can no longer pay its way. A failed line's ships are sold by the receivers, some cheaply to the
   Morven Line's brokers; a new line comes in behind it after a while.
   Money here is in the pounds of the day; the running cost table is kept in 1921 pounds and scaled by the price
   index and the costs of the moment (wages, coal, dues, all of which fall in a slump). */
const CO_RATE=0.05;    // interest on a line's borrowing, a year
const CO_PRICE=17;     // a new rival ship, pounds per gross ton in 1921 money (they build in series, and cheaper than we do)
const CO_VAR=0.3;      // costs that move with the trade: agents' commission, provisions, cargo handling, as a share of takings
const CO_MARGIN=0.08;  // what a line keeps of its takings in the reference year, after all running costs
/* the reference year: the game's first (1900 on the new calendar); games begun in 1921 used 1922, the post-war crash over */
const coRef=()=>newCal()?S.m0:ym(1922,0);
const coAlive=o=>!!(S.rivals[o]&&!S.rivals[o].dead);  // dead: true once failed; deadM: the month
const coLive=()=>Object.keys(RIVAL_P).filter(coAlive);
function coAll(){return coLive().map(o=>S.rivals[o]);}
/* running costs move with wages, bunker coal and port dues, and with the price level */
function coCostIdx(m){return PX()*(0.55*slumpK('wage',m)+0.3*clamp(coalPrice(m)/1.6,0.7,1.8)*slumpK('fuel',m)+0.15*slumpK('dues',m));}
const coAge=x=>Math.max(0,yearOfM(S.m)-x.built);
const coShipVal=x=>x.grt*CO_PRICE*PX()*Math.max(0.1,1-coAge(x)/35)*shipMkt();
const coNewPrice=x=>Math.round(x.grt*CO_PRICE*PX()/1000)*1000;
const coScrap=x=>x.grt*2*PX();
const coFleet=o=>S.rships.filter(x=>x.owner===o);
/* a line's share of all rival tonnage */
const coShare=o=>coFleet(o).reduce((a,x)=>a+x.grt,0)/Math.max(1,S.rships.reduce((a,x)=>a+x.grt,0));
const coValue=o=>coFleet(o).reduce((a,x)=>a+coShipVal(x),0);
/* what the line is worth: cash plus ships less borrowing */
const coWorth=o=>{const co=S.rivals[o];return co.cash+coValue(o)-co.debt;};
/* the fixed running costs for a month (crew, coal, dues, upkeep): every ship, by route, at the costs of the moment */
function coCosts(o,m){let c=0;const k=coCostIdx(m);for(const x of coFleet(o))c+=x.grt*(S.rcost[x.route]||coMedianCost())*k;return c;}
function coMedianCost(){const v=Object.values(S.rcost||{}).filter(x=>x>0).sort((a,b)=>a-b);return v.length?v[Math.floor(v.length/2)]:1;}
/* the last twelve months, summed */
const coYear=(o,f)=>(S.rivals[o].h||[]).reduce((a,q)=>a+q[f],0);
const coProfit=o=>{const h=S.rivals[o].h||[];return h.length?coYear(o,'net')*12/h.length:0;};
/* keep about three months' costs in the bank; borrow up to the character's share of the fleet's value */
const coReserve=o=>3*Math.max(20000*PX(),(S.rivals[o].h||[]).slice(-3).reduce((a,q)=>a+q.cost,0)/Math.max(1,Math.min(3,(S.rivals[o].h||[]).length)));
const coMaxDebt=o=>RIVAL_P[o].lev*coValue(o);
const coShort=o=>S.rivals[o].cash<0||S.rivals[o].debt>coMaxDebt(o)*0.95;
function coCanPay(o,price,fight){const co=S.rivals[o],room=Math.max(0,coMaxDebt(o)+price*RIVAL_P[o].lev-co.debt);
  return co.cash-coReserve(o)*(fight?0.5:1)+room>=price;}
/* pay for a ship: from the bank down to the reserve, the rest borrowed against her */
function coPay(o,price){const co=S.rivals[o],own=clamp(co.cash-coReserve(o),0,price);co.cash-=own;co.debt+=price-own;}

/* each route's fixed running costs per gross ton, set so its rival fleet keeps CO_MARGIN of its takings in the reference year */
function coCalibrate(rk){
  let rev=0,grt=0,k=0;
  const r0=coRef();for(let i=0;i<12;i++){const st=routeStats(rk,r0+i);for(const o in st.owners){rev+=st.owners[o].rev;grt+=st.owners[o].grt;}k+=coCostIdx(r0+i);}
  if(grt<=0)return;const rpg=rev/grt,idx=k/12;
  S.rcost[rk]=rpg*(1-CO_VAR-CO_MARGIN)/idx;
}
/* a company record for every line, and running costs for every route: new games and 0.19 saves alike */
function coEnsure(){
  S.rcost=S.rcost||{};S.coFails=S.coFails||[];S.coQueue=S.coQueue||[];S.coNew=S.coNew||[];S.genCos=S.genCos||{};
  for(const rk in ROUTES)if(S.rcost[rk]===undefined&&S.rships.some(x=>x.route===rk))coCalibrate(rk);
  for(const o in RIVAL_P){const P=RIVAL_P[o];let co=S.rivals[o];
    // a line starts with its own capital plus about two months' takings in the bank, and has borrowed against its fleet
    if(!co){let rev=0;for(const rk in ROUTES){const q=routeStats(rk,S.m).owners[o];if(q)rev+=q.rev;}co=S.rivals[o]={cash:Math.round((P.cash*PX()+2*rev)/1000)*1000};}
    if(co.debt===undefined){co.debt=Math.round(P.lev*0.6*coValue(o)/1000)*1000;co.h=[];}}
}

/* ---------- the month's accounts ---------- */
function coAccounts(o,stats){
  const co=S.rivals[o],m=S.m;let rev=0,wars=0;
  for(const rk in stats){const q=stats[rk].owners[o];if(!q)continue;rev+=q.rev;if(S.wars[rk])wars+=q.ships*1000*PX();}
  // in the war the state carries the ships it has taken (and pays their hire); a German line's ships lie idle in neutral ports
  const wf=warRivalF(o,m),held=atWar(m)&&wf<1?1-wf:0,hire=wf>0&&held?coFleet(o).reduce((a,x)=>a+x.grt,0)*held*0.34*PX():0;rev+=hire;
  const run=coCosts(o,m)*(wf===0&&pre21(m)?0.1:1-held)+CO_VAR*rev+wars,int=co.debt*CO_RATE/12,net=rev-run-int;
  co.cash+=net;co.h=co.h||[];co.h.push({rev:Math.round(rev),cost:Math.round(run+int),net:Math.round(net)});if(co.h.length>12)co.h.shift();
}
/* borrow when short, repay when flush, sell when the bank says no, and fail when nothing is left to sell */
function coFinance(o,stats){
  const co=S.rivals[o],P=RIVAL_P[o],res=coReserve(o),max=coMaxDebt(o);
  if(co.cash<0){const b=Math.max(0,Math.min(max-co.debt,-co.cash+res*0.5));co.debt+=b;co.cash+=b;}
  else if(co.cash>2*res&&co.debt>0){const r=Math.min(co.debt,(co.cash-2*res)*(P.lev<=0.3?0.8:0.4));co.debt-=r;co.cash-=r;}
  if(co.debt>max*1.15&&co.cash>res){const r=Math.min(co.debt-max,co.cash-res);co.debt-=r;co.cash-=r;} // the bank calls in what the fleet no longer covers
  if(co.cash>=0||atWar()||warRivalF(o,S.m)===0)return; // under the state's control in the war nobody sells up
  // short of money and the bank will lend no more: sell the ship that raises most for the least trade, oldest first
  const fleet=coFleet(o).sort((a,b)=>a.built-b.built);
  if(fleet.length>1&&co.cash<-0.25*res){const x=fleet[0],buyer=coBuyer(x,o);
    // the lender secured on her takes half of what she fetches
    const p=coShipVal(x)*(buyer?0.8:0.6),repay=Math.min(co.debt,p*0.5);co.debt-=repay;co.cash+=p-repay;
    if(buyer){coPay(buyer,p);x.owner=buyer;rivalMove(o,x.route,'sold',x.name);S.rmoves[0].to=buyer;}
    else{dropRival(x);rivalMove(o,x.route,'sold',x.name);}
  }
  const worth=coWorth(o);
  if(worth<0||co.cash<-Math.max(60000*PX(),0.12*coValue(o))||!coFleet(o).length)coFail(o);
}
/* January: the directors pay the shareholders a share of last year's profit, and a flush line renews its oldest ship */
function coYearEnd(o){
  const co=S.rivals[o],P=RIVAL_P[o],res=coReserve(o),p=coYear(o,'net');
  const div=Math.max(0,Math.min(p*(P.lev>=0.45?0.7:0.5),co.cash-2*res));co.div=Math.round(div);co.cash-=div;
  const old=coFleet(o).sort((a,b)=>a.built-b.built)[0];
  if(old&&coAge(old)>=22&&p>0&&!atWar()&&Math.random()<0.35*P.aggr){const x=makeRivalShip(o,old.route,Math.floor(yearOfM(S.m))),era=Math.max(0,(S.m-ym(1930,0))/12);
    x.knots=+(P.knots[1]-Math.random()+Math.min(5,era*0.15)+shipEraKnots(x.built)).toFixed(1);if(era>0)x.grt=Math.round(x.grt*(1+Math.min(0.5,era*0.02))/100)*100;
    const price=coNewPrice(x);if(coCanPay(o,price)){coPay(o,price);dropRival(old);co.cash+=coScrap(old);S.rships.push(x);newRivalVis(x);
      S.rmoves.unshift({m:S.m,o,rk:old.route,kind:'renew',ship:x.name,old:old.name});if(S.rmoves.length>40)S.rmoves.length=40;
      if(S.lines[old.route])news(`${RIVALS[o].name} replaces the old SS ${old.name} on ${ROUTES[old.route].name} with the new SS ${x.name}, ${x.knots} knots.`,'bad');}}
}
/* a line with money and room to borrow that sails the ship's route, or failing that any line of the same kind */
function coBuyer(x,seller){
  const kind=RIVAL_P[seller].kind||'liner',price=coShipVal(x)*0.8;
  const c=coLive().filter(o=>o!==seller&&(RIVAL_P[o].kind||'liner')===kind&&coCanPay(o,price)&&coProfit(o)>0&&coShare(o)<0.3); // the biggest lines are kept off the auction by their bankers
  c.sort((a,b)=>(coFleet(b).some(y=>y.route===x.route)?1:0)-(coFleet(a).some(y=>y.route===x.route)?1:0)||coWorth(b)-coWorth(a));
  return c[0]||null;
}
/* the receivers: some ships to other lines, the best bargains to the Morven Line's brokers, the old to the breakers */
function coFail(o){
  // a great line is not let go at the first failure: its bankers reconstruct it once, writing down its debts and
  // selling its two oldest ships, and it sails on
  if(!S.rivals[o].rescued&&coFleet(o).length>=8&&!S.rivals[o].born){const co=S.rivals[o];co.rescued=S.m;
    co.debt=Math.round(co.debt*0.6);for(const x of coFleet(o).sort((a,b)=>a.built-b.built).slice(0,2)){co.cash+=coShipVal(x)*0.6;dropRival(x);rivalMove(o,x.route,'sold',x.name);}
    co.cash=Math.max(co.cash,coReserve(o));
    news(`${RIVALS[o].name} is in difficulties. Its bankers reconstruct it: debts written down, two old ships sold, and it sails on.`,'',false);return;}
  const co=S.rivals[o],m=S.m,R=Math.random,name=RIVALS[o].name,fleet=coFleet(o).sort((a,b)=>b.built-a.built);
  const routes=[...new Set(fleet.map(x=>x.route))],n=fleet.length,took={};let ours=0,sold=0,broken=0;
  for(const x of fleet){
    if(ours<2&&coAge(x)<26&&(ours===0||R()<0.4)){coToMarket(x,o);dropRival(x);ours++;continue;}
    let buyer=coAge(x)<28&&R()<0.85?coBuyer(x,o):null;if(buyer&&(took[buyer]||0)>=4)buyer=null; // no line takes more than four
    if(buyer){took[buyer]=(took[buyer]||0)+1;coPay(buyer,coShipVal(x)*0.6);x.owner=buyer;sold++;S.rmoves.unshift({m,o,rk:x.route,kind:'sold',ship:x.name,to:buyer});continue;}
    dropRival(x);broken++;}
  co.dead=true;co.deadM=m;co.cash=0;co.debt=0;co.h=[];
  S.coFails.unshift({o,m,ships:n,routes});if(S.coFails.length>30)S.coFails.length=30;
  S.rmoves.unshift({m,o,rk:routes[0]||'liv',kind:'fail'});if(S.rmoves.length>40)S.rmoves.length=40;
  const mine=routes.some(rk=>S.lines[rk]);
  if(n<=2)news(`${name} has sold ${n===1?'its last ship':'its last two ships'} and been wound up, its capital lost.${mine?' Its trade on '+routes.map(rk=>ROUTES[rk].name).join(' and ')+' is up for grabs.':''}`,mine?'good':'',mine);
  else news(`${name} has failed and is in the hands of the receivers. Of its ${n} ship${n===1?'':'s'}, ${[sold?`${sold} ${sold===1?'goes':'go'} to ${sold===1?'another line':'other lines'}`:'',ours?`${ours} ${ours===1?'is':'are'} offered through the brokers`:'',broken?`${broken} ${broken===1?'goes':'go'} for scrap or abroad`:''].filter(Boolean).join(', ')}.${mine?' Its trade is up for grabs.':''}`,mine?'good':'',true);
  S.coQueue.push({at:m+4+Math.floor(R()*9),kind:RIVAL_P[o].kind||'liner',routes,flag:RIVALS[o].flag});
}
/* a failed line's ship, offered cheaply to the Morven Line by the receivers */
function coToMarket(x,o){
  const t={name:x.name,built:x.built,grt:x.grt,knots:x.knots,berths:{f:x.berths.f,s:x.berths.s,t:x.berths.t,tt:0},cargo:x.cargo,fuel:yearOfM(S.m)>=1925&&x.built>=1920?'oil':'coal',base:x.grt*26,note:`Ex-${RIVALS[o].name}, sold cheaply by the receivers.`};
  t.reefer=x.reefer;const sh=makeShip(t,55+Math.random()*20,['GLA','LIV','NAP'][Math.floor(Math.random()*3)]);sh.price=Math.round(shipValue(sh)*0.7/100)*100;sh.bargain=true;sh.listed=S.m;S.market.push(sh);
}

/* ---------- new lines ---------- */
/* lines that may be founded in play, by kind. Invented names in the setting's world. */
const CO_POOL=[
  {id:'caledon',name:'Caledon & Clyde Line',flag:'British',kind:'liner',col:'#6D3B2E',prestige:1.0,aggr:0.9,lev:0.4,names:['Strathmore','Glen Affric','Loch Etive','Ben Lawers','Lammermuir','Kintail','Morvern Star','Ardgour']},
  {id:'hansa',name:'Hanseatic Star Line',flag:'German',kind:'liner',col:'#3F5A4A',prestige:1.05,aggr:1.1,lev:0.5,names:['Vierland','Wismar','Rostock Star','Lübeck','Travemünde','Stade','Kehdingen','Buxtehude']},
  {id:'fjord',name:'Fjordheim Line',flag:'Norwegian',kind:'liner',col:'#2F5E7A',prestige:1.0,aggr:0.7,lev:0.3,names:['Hardanger','Sognefjord','Trondhjem','Nordfjord','Romsdal','Lofoten','Vesteraalen','Telemark']},
  {id:'schelde',name:'Scheldemond Line',flag:'Dutch',kind:'liner',col:'#C0602A',prestige:1.05,aggr:0.8,lev:0.35,names:['Walcheren','Zuid-Beveland','Veere','Vlissingen','Tholen','Schouwen','Duiveland','Axel']},
  {id:'polare',name:'Linea Stella Polare',flag:'Italian',kind:'liner',col:'#4E7F52',prestige:0.95,aggr:1.0,lev:0.5,names:['Stella Maris','Aurora Borealis','Vega','Altair','Polluce','Castore','Arturo','Sirio']},
  {id:'hudson',name:'Hudson & Harbor Steamship Co.',flag:'American, dry',kind:'liner',col:'#3C4F6B',prestige:0.9,aggr:0.8,lev:0.3,names:['Tappan Zee','Palisades','Catskill','Saratoga','Adirondack','Mohawk Valley','Ticonderoga','Poughkeepsie']},
  {id:'maurice',name:'St Maurice Steamship Co.',flag:'Canadian',kind:'liner',col:'#7A4B2A',prestige:0.95,aggr:0.8,lev:0.35,names:['Trois-Rivières','Shawinigan','Batiscan','Champlain','Portneuf','Lotbinière','Bécancour','Nicolet']},
  {id:'wear',name:'Wear & Gulf Steamship Co.',flag:'British',kind:'cargo',col:'#5F5A4A',prestige:0.8,aggr:0.8,lev:0.4,names:['Sunderland Bay','Hylton','Southwick','Monkwearmouth','Roker','Hendon Bank','Ryhope','Pallion']},
  {id:'caribee',name:'Caribee Fruit Line',flag:'British',kind:'fruit',col:'#A0782A',prestige:0.95,aggr:0.8,lev:0.3,names:['Port Maria','Oracabessa','Bluefields','Black River','Negril','Falmouth Bay','Annotto Bay','Morant']},
  {id:'delta',name:'Niger Delta Steamers',flag:'British',kind:'mixed',col:'#6A7A3A',prestige:0.9,aggr:0.9,lev:0.4,names:['Forcados','Brass','Akassa','Degema','Burutu','Warri','Sapele','Onitsha']},
  {id:'rionegro',name:'Rio Negro Line',flag:'British',kind:'plate',col:'#7E3A55',prestige:1.0,aggr:0.9,lev:0.45,names:['Bahía Blanca','Neuquén','Patagones','Viedma','Chubut','Santa Cruz','Tierra del Fuego','Río Colorado']},
  {id:'horizon',name:'Blue Horizon Cruising Co.',flag:'British, cruises only',kind:'cruise',col:'#4C8A9A',prestige:1.05,aggr:0.6,lev:0.3,names:['Blue Horizon','Tradewind','Sea Breeze','Silver Isle','Summer Star','Island Queen','Corona','Laguna']}
];
const CO_KNOTS={liner:[15,19],cargo:[10,13],fruit:[14,16],mixed:[11,14],plate:[13,16],cruise:[14,17]},CO_GRT={liner:[10000,17000],cargo:[5000,8000],fruit:[4000,7000],mixed:[5000,9000],plate:[8000,14000],cruise:[8000,14000]};
/* lines founded in play are saved as data and put back in the tables on load */
function coRegister(){for(const id in (S.genCos||{})){const d=S.genCos[id];RIVALS[id]={name:d.name,flag:d.flag};RIVAL_P[id]={...d.P};}}
function coFound(q){
  const m=S.m,R=Math.random,used=new Set(Object.keys(RIVAL_P));
  let d=CO_POOL.find(c=>!used.has(c.id)&&c.kind===q.kind)||CO_POOL.find(c=>!used.has(c.id)&&c.kind==='liner'&&q.kind!=='cruise'&&q.kind!=='cargo');
  if(!d){const base=CO_POOL.filter(c=>c.kind===q.kind)[0]||CO_POOL[0],n=Object.keys(S.genCos).length+2;
    d={...base,id:base.id+n,name:base.name.replace(/( Line| Co\.| Steamers| Steamship Co\.)$/,` (${['New','Reformed','Second','United'][n%4]})$1`)};}
  const P={lev:d.lev,prestige:d.prestige,aggr:d.aggr,cash:0,col:d.col,knots:CO_KNOTS[d.kind].slice(),grt:CO_GRT[d.kind].slice(),kind:d.kind==='liner'?undefined:d.kind,names:d.names.slice()};
  const era=Math.max(0,(m-ym(1921,0))/12);P.knots=P.knots.map(k=>+(k+Math.min(4,era*0.1)).toFixed(1));P.grt=P.grt.map(g=>Math.round(g*(1+Math.min(0.5,era*0.015))/100)*100);
  S.genCos[d.id]={name:d.name,flag:d.flag,P,born:m};RIVALS[d.id]={name:d.name,flag:d.flag};RIVAL_P[d.id]=P;
  const kindOK=rk=>isCruise(rk)===(d.kind==='cruise')&&routeOpen(rk,m);
  // the promoters look at the trade the failed line left, but put their ships where loads are best
  const rel=q.rel||{},score=rk=>(rel[rk]===undefined?0.8:rel[rk])+(q.routes.includes(rk)?0.15:0)-0.02*S.rships.filter(x=>x.route===rk).length;
  let routes=Object.keys(ROUTES).filter(kindOK).sort((a,b)=>score(b)-score(a));
  // a trade the failed line left with no rival ships at all comes first
  const fill=q.fill&&kindOK(q.fill)?q.fill:q.routes.find(rk=>kindOK(rk)&&!S.rships.some(x=>x.route===rk));
  routes=(fill?[fill,...routes.filter(rk=>rk!==fill)]:routes).slice(0,2);
  const n=2+Math.floor(R()*3),ships=[];
  for(let i=0;i<n;i++){const x=makeRivalShip(d.id,routes[i%routes.length],Math.floor(yearOfM(m))-Math.floor(R()*4));ships.push(x);}
  const cost=ships.reduce((a,x)=>a+coNewPrice(x),0);
  // the promoters raise enough for the ships and about four months' running costs
  // a speculative line of 1919 and 1920 buys at bubble prices on borrowed money and keeps little in hand
  if(q.spec){P.lev=0.75;P.spec=true;const c2=cost*warShips(m);S.rivals[d.id]={cash:Math.round((c2*0.08+40000*PX())/1000)*1000,debt:Math.round(c2*0.75/1000)*1000,h:[],born:m,spec:true};}
  else S.rivals[d.id]={cash:Math.round((cost*0.3+80000*PX())/1000)*1000,debt:Math.round(cost*Math.min(0.5,P.lev)/1000)*1000,h:[],born:m};
  for(const x of ships){S.rships.push(x);newRivalVis(x);}
  S.coNew.unshift({o:d.id,m,routes});if(S.coNew.length>30)S.coNew.length=30;
  S.rmoves.unshift({m,o:d.id,rk:routes[0],kind:'enter'});if(S.rmoves.length>40)S.rmoves.length=40;
  const mine=routes.some(rk=>S.lines[rk]);
  news(`${q.spec?'Floated on borrowed money at the top of the market, a':'A'} new line, the ${d.name} (${d.flag.split(',')[0]}), starts sailing on ${routes.map(rk=>ROUTES[rk].name).join(' and ')} with ${n} ships.${mine?' More competition for your ships there.':''}`,mine?'bad':'',mine);
}
/* the queue of lines to come, and fresh capital for any open trade that has been left with no rival ships at all */
function coEntrants(stats){
  const m=S.m;S.coQueue=S.coQueue||[];if(atWar(m))return; // nobody founds a line in the war
  if(m%12===0)for(const rk in ROUTES){if(!routeOpen(rk,m)||S.coQueue.some(q=>q.routes.includes(rk)))continue;
    const st=RIVAL_START[rk];if(!st&&!S.rcost[rk])continue; // routes that never had rival lines stay the player's own
    const kind=isCruise(rk)?'cruise':(st&&RIVAL_P[st[0][0]]&&RIVAL_P[st[0][0]].kind)||'liner',here=S.rships.filter(x=>x.route===rk);
    // an empty trade draws new capital quickly; one line holding a full trade to itself draws a challenger in time
    const by={};for(const x of here)by[x.owner]=(by[x.owner]||0)+x.grt;const tot=here.reduce((a,x)=>a+x.grt,0),top=Math.max(0,...Object.values(by));
    const q=stats[rk],p=q?Object.values(q.owners).reduce((a,o)=>a+o.pax,0):0,c=q?Object.values(q.owners).reduce((a,o)=>a+o.cap,0):0,rel=c?p/c/Math.max(0.05,S.load0[rk]*seasonNorm(rk,m)):0;
    if(!here.length?Math.random()<0.9:(top>0.7*tot&&rel>1.05&&coLive().length<14&&Math.random()<0.06))S.coQueue.push({at:m+3+Math.floor(Math.random()*7),kind,routes:[rk],fill:here.length?null:rk});}
  const due=S.coQueue.filter(q=>q.at<=m);if(!due.length)return;
  const rel={};for(const rk in stats){const q=stats[rk];let p=0,c=0;for(const o in q.owners){p+=q.owners[o].pax;c+=q.owners[o].cap;}rel[rk]=c?p/c/Math.max(0.05,S.load0[rk]*seasonNorm(rk,m)):1.3;}
  S.coQueue=S.coQueue.filter(q=>q.at>m);
  // a slump puts off the promoters: the line waits for better times
  for(const q of due){if(slump(m)>0.4&&Math.random()<0.7){q.at=m+6;S.coQueue.push(q);continue;}q.rel=rel;coFound(q);}
}
/* how the line is run, in words */
function coCharacter(o){const P=RIVAL_P[o];
  return [P.aggr>=1.1?'aggressive':P.aggr>=0.9?'combative':'cautious',P.prestige>=1.05?'goes for prestige':'goes for volume',P.lev>=0.45?'a heavy borrower':P.lev<=0.25?'keeps its money in the bank':'borrows with care'];}
function coHealth(o){const co=S.rivals[o];if(co.dead)return ['Failed','bad'];
  const v=coValue(o),g=v?co.debt/v:0,p=coProfit(o);
  if(co.cash<0||coWorth(o)<0.15*v)return ['In trouble','bad'];
  if((co.h||[]).length>=6&&p<0||g>RIVAL_P[o].lev*0.9)return ['Stretched','yard'];
  return p>0.1*v?['Prospering','sea']:['Sound','sea'];}
