/* ================= THE GREAT WAR: THE WAR ECONOMY, 1914 TO 1919 =================
   War comes suddenly in August 1914 (on the 1900 calendar only). Passengers vanish, freight pays several times over,
   and the state takes ships for its own service.
   - Passengers: emigration stops; cabin travel falls to a trickle (Americans still cross until April 1917). The
     Hamburg trade and the cruises close. Nordmark and the other German lines lie in neutral ports.
   - Freight: every ship's holds fill, at rates that climb to about three times their 1913 worth (over and above the
     rise in prices), held down from 1917 when the Ministry of Shipping controls the rates. A liner can clear her steerage decks for cargo with a cheap refit, and put them back afterwards.
   - Costs: coal, wages and second-hand ships all climb. The yards work for the Admiralty: no new orders, and ships
     already on the stocks go slowly.
   - Requisition: from October 1912 the Admiralty keeps a reserve list. At war it takes a growing share of the fleet
     as troopships, hospital ships, armed merchant cruisers and transports, at a fixed hire well below freight. A line
     with ships on the list chooses which go and is paid better; one without has its biggest and fastest taken.
     Admiralty-terms ships go first. They come home in 1919, worn, with a sum towards their refit.
   - Excess Profits Duty: each January, on the year before: half the profit above the pre-war standard, three fifths
     for 1916, four fifths for 1917 and 1918, two fifths for 1919, three fifths for 1920.
   The attacks, the war-risk insurance and the convoys come in 0.27; the boom and crash of 1919 to 1921 in 0.28. */
const WAR_FROM=ym(1914,7),ARMISTICE=ym(1918,10),US_WAR=ym(1917,3),RESERVE_FROM=ym(1912,9),HAM_BACK=ym(1920,0);
const atWar=m=>{m=m===undefined?S.m:m;return newCal()&&m>=WAR_FROM&&m<=ARMISTICE;};
/* a curve of [month, value] points, straight lines between, flat beyond the ends */
function curveAt(P,m){if(m<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(m<=P[i][0]){const [a,x]=P[i-1],[b,y]=P[i];return x+(y-x)*(m-a)/Math.max(1,b-a);}return P[P.length-1][1];}
const WAR_FREIGHT=[[ym(1914,6),1],[ym(1914,7),1.1],[ym(1915,0),1.2],[ym(1916,0),1.3],[ym(1917,0),1.15],[ym(1918,10),1.1],[ym(1919,0),1.4],[ym(1920,0),1.6],[ym(1920,8),1.2],[ym(1920,11),1]];
const WAR_COAL=[[ym(1914,6),1],[ym(1914,7),1.2],[ym(1916,0),1.55],[ym(1918,0),1.8],[ym(1919,0),1.6],[ym(1920,11),1.1]];
const WAR_WAGE=[[ym(1914,6),1],[ym(1914,9),1.1],[ym(1916,0),1.25],[ym(1918,0),1.4],[ym(1919,6),1.3],[ym(1920,11),1.1]];
const WAR_SHIPS=[[ym(1914,6),1],[ym(1914,7),1.05],[ym(1915,0),1.2],[ym(1916,0),1.4],[ym(1917,0),1.6],[ym(1919,0),1.8],[ym(1920,0),2.0],[ym(1920,11),1.8]]; // over and above prices, which themselves more than double
/* the state's war-risk insurance: a monthly premium on the value of every ship still trading, dearest when the submarines are
   at their worst in 1917. It pays four fifths of a ship lost to the enemy (the losses themselves come in 0.27) */
const WAR_INS=[[ym(1914,7),0.012],[ym(1915,0),0.008],[ym(1916,0),0.012],[ym(1917,1),0.02],[ym(1918,0),0.015],[ym(1918,10),0.008]];
const warInsRate=m=>atWar(m)?curveAt(WAR_INS,m):0;
const warInsCost=sh=>warInsRate(S.m)*shipValue(sh);
/* the share of the fleet the state has on its service */
const REQ_SHARE=[[ym(1914,7),0.15],[ym(1915,0),0.3],[ym(1916,0),0.45],[ym(1917,0),0.75],[ym(1918,10),0.85]]; // from 1917 the Liner Requisition Scheme takes nearly every ocean-going ship
const pre21=m=>newCal()&&m>=WAR_FROM&&m<M21;
const warFreight=m=>pre21(m)?curveAt(WAR_FREIGHT,m):1;
const warCoal=m=>pre21(m)?curveAt(WAR_COAL,m):1;
const warWage=m=>pre21(m)?curveAt(WAR_WAGE,m):1;
const warShips=m=>pre21(m)?curveAt(WAR_SHIPS,m):1;
/* in wartime there is cargo for every hold */
const warCargoVol=m=>atWar(m)?1.35:pre21(m)?1.2:1;
const reqShare=m=>atWar(m)?curveAt(REQ_SHARE,m):0;
/* passengers in wartime, as a multiple of what they would have been: the collapse takes two or three months */
function warPax(c,rk,m){
  if(!pre21(m))return 1;const r=ROUTES[rk];
  let w=c==='t'||c==='tt'?0.1:m<US_WAR?0.3:0.18;
  if(r.group!=='North Atlantic'&&r.group!=='Canada'&&c!=='t')w*=1.6; // colonial and business travel to the south holds up better
  w=Math.min(1,w);
  if(m<=ARMISTICE){const k=m-WAR_FROM;return k===0?1-(1-w)*0.5:k===1?1-(1-w)*0.8:w;}
  return w+(1-w)*Math.min(1,(m-ARMISTICE)/12); // back to the pre-war trade over the year after the armistice (the rush of 1920 comes in 0.28)
}
/* going home at the outbreak: reservists and families crowd the eastbound steerage in August and September 1914 */
const warReturn=m=>newCal()&&(m===WAR_FROM||m===WAR_FROM+1)?2.2:1;
/* the German lines leave the Atlantic; the other belligerents lose ships to their own states' service */
function warRivalF(o,m){
  if(!pre21(m))return 1;const fl=(RIVALS[o]&&RIVALS[o].flag)||'';
  if(/German/.test(fl))return m<HAM_BACK?0:0.5;
  if(!atWar(m))return 1;
  if(/American/.test(fl))return m<US_WAR?1.1:0.8;
  if(/Norwegian|Dutch/.test(fl))return 1;
  if(/Italian/.test(fl)&&m<ym(1915,4))return 1;
  return 1-0.8*reqShare(m);
}
const warClosed=(rk,m)=>newCal()&&((rk==='ham'&&m>=WAR_FROM&&m<HAM_BACK)||(ROUTES[rk].cruise&&atWar(m)));
const warNoBuild=()=>atWar(S.m);

/* ---------- each month ---------- */
function warMonth(){
  if(!newCal())return;const m=S.m;S.war=S.war||{};const W=S.war;
  if(m===RESERVE_FROM)news('With the naval scare at its height, the Admiralty asks the lines to put ships on its reserve list for war service. A ship on the list may be called up in a war; a line that volunteers will be treated better. See the Company tab.','hist',true);
  if(m===WAR_FROM&&!W.began){W.began=true;warBegins();}
  if(m===US_WAR)news('The United States declares war on Germany. The American lines lose their neutral trade, and their government begins to build ships in huge numbers.','hist',true);
  if(m===ARMISTICE+1&&!W.over){W.over=true;news('The armistice is signed. The guns fall silent at eleven o\'clock on the eleventh of November. The Admiralty will return requisitioned ships over the coming year.','hist',true);}
  if(atWar(m))reqMonth();
  if(m>=ym(1919,2)&&m<ym(1920,0))reqReturns();
  for(const sh of S.ships)if(sh.state==='req')reqWear(sh);
}
function warBegins(){
  const W=S.war;W.base=Math.max(0,netWorth());W.julyNet=S.yearNet||0;W.show=true;
  for(const rk of Object.keys(S.wars))delete S.wars[rk]; // no rate wars in a real one
  news('War. Britain declares war on Germany. Emigrants cancel, cabin passengers stay at home, the German ships run for neutral ports, and freight rates are climbing by the day.','hist',true);
  if(typeof UI!=='undefined'){UI.warPrev=UI.speed;if(UI.autoPause!==false)UI.speed=0;UI.dirty=true;}
}

/* ---------- requisition ---------- */
const reserveN=()=>S.ships.filter(x=>x.reserve).length;
const goodwill=()=>(S.war&&S.war.gw)||0;
function reqRole(sh){
  const pax=paxBerths(sh),cab=(sh.berths.f||0)+(sh.berths.s||0);
  if(sh.adm||(knotsOf(sh)>=18&&sh.grt>=10000))return 'amc';
  if(pax<60)return 'transport';
  if(cab>=300&&(S.war.hosp||0)<=(S.war.troop||0)/2)return 'hospital';
  return 'troop';
}
const REQ_NAME={amc:'an armed merchant cruiser',hospital:'a hospital ship',troop:'a troopship',transport:'a transport'};
const REQ_RATE={amc:0.4,hospital:0.36,troop:0.34,transport:0.3};
/* the net hire the Admiralty pays a month: the state pays her crew, coal and insurance */
const reqHire=sh=>Math.round(sh.grt*REQ_RATE[sh.req.role]*PX()*(sh.req.gw?1.15:1));
const reqCount=()=>S.ships.filter(x=>x.state==='req'||x.reqDue).length;
const reqOrder=a=>a.slice().sort((x,y)=>(y.adm?1e9:0)+y.grt*knotsOf(y)-(x.adm?1e9:0)-x.grt*knotsOf(x));
function reqMonth(){
  const W=S.war,fleet=S.ships.filter(x=>x.state!=='lost'),want=Math.round(reqShare(S.m)*fleet.length),have=reqCount();
  if(W.ask&&S.m>=W.ask.due){const n=W.ask.n;W.ask=null;reqTake(reqOrder(fleet.filter(x=>x.state!=='req'&&!x.reqDue)).slice(0,n),false,'The Admiralty has chosen for you');}
  if(want<=have||W.ask)return;
  const n=want-have,free=fleet.filter(x=>x.state!=='req'&&!x.reqDue);if(!free.length)return;
  const vol=free.filter(x=>x.reserve||x.adm);
  if(vol.length){const take=reqOrder(vol).slice(0,n);reqTake(take,true);if(take.length>=n)return;}
  const left=want-reqCount();if(left<=0)return;
  if(reserveN()+goodwill()>0){W.ask={n:left,due:S.m+1};news(`The Admiralty needs ${left===1?'another ship':left+' more ships'} for war service. As a line on its reserve list you may choose which. It is under Needs attention.`,'bad',true);}
  else reqTake(reqOrder(free).slice(0,left),false,'The Admiralty requisitions');
}
function reqTake(list,vol,why){
  for(const sh of list){const role=reqRole(sh);sh.reqDue={role,gw:vol||reserveN()+goodwill()>0};S.war[role==='hospital'?'hosp':'troop']=(S.war[role==='hospital'?'hosp':'troop']||0)+1;
    if(sh.state!=='sea'&&sh.state!=='repo'&&sh.state!=='yard')reqStart(sh);}
  if(list.length)news(`${why||'Called up from the reserve list'}: ${list.map(x=>`SS ${x.name} as ${REQ_NAME[x.reqDue?x.reqDue.role:x.req.role]}`).join(', ')}. ${list.some(x=>x.state==='sea')?'Ships at sea go when they reach port. ':''}The Admiralty pays a fixed hire and carries her crew and coal.`,'bad',true);
}
/* she reaches port, or is already there: into the state's service */
function reqStart(sh){
  const d=sh.reqDue;if(!d)return;sh.reqDue=null;sh.req={role:d.role,gw:d.gw,since:S.m,line:sh.line};
  if(sh.pendingYard){sh.pendingYard=null;sh.yardAdd=[];}sh.line=null;sh.state='req';sh.load=null;sh.stopLeft=0;
  wire(sh,`SS ${sh.name} taken up by the Admiralty as ${REQ_NAME[d.role]}. Crew signed on for war service.`,'');
}
/* the Line asks: which ships go (called from the Needs attention card) */
function reqChoose(id){const W=S.war;if(!W||!W.ask)return;const sh=S.ships.find(x=>x.id===id);if(!sh||sh.state==='req'||sh.reqDue)return;
  reqTake([sh],true,'Offered by the Line');W.ask.n--;if(W.ask.n<=0)W.ask=null;W.gw=(W.gw||0)+1;}
/* each month on service: the hire, hard wear, a little standing for the Line */
function reqWear(sh){
  book('charter',reqHire(sh),'_idle',sh);
  sh.cond=clamp(sh.cond-1.2,20,95);addFat(sh,0.08);sh.fit=Math.max(0,(sh.fit||80)-2);
  S.rep=clamp(S.rep+(sh.req.role==='hospital'?0.12:0.05),0,100);
}
/* 1919: the ships come home, worn, with a sum from the Admiralty towards putting them right */
function reqReturns(){
  for(const sh of S.ships){if(sh.state!=='req')continue;if(Math.random()>(S.m>=ym(1919,10)?1:0.22))continue;
    const pay=Math.round(sh.grt*0.9*PX()/100)*100;book('charter',pay,'_idle',sh);
    const was=sh.req.role,line=sh.req.line;sh.req=null;sh.state='laid';sh.line=line&&S.lines[line]?line:null;if(sh.line){sh.state='port';sh.portLeft=3;}
    news(`SS ${sh.name} is released from war service as ${REQ_NAME[was]}. The Admiralty pays ${fmt(pay)} towards her refit; she is ${Math.round(sh.cond)}% and ${fatWord(sh).toLowerCase()}.${sh.line?' She goes back to her own service.':''}`,'good',true);}
}

/* ---------- clearing the steerage for cargo ---------- */
const WC_T=3.2*0.35,WC_TT=5.5*0.35; // tons of cargo a steerage or tourist berth's space will take
function warCargoOn(sh){if(sh.wcSave)return;sh.wcSave={t:sh.berths.t||0,tt:sh.berths.tt||0,cargo:sh.cargo};sh.cargo=Math.round(sh.cargo+sh.wcSave.t*WC_T+sh.wcSave.tt*WC_TT);sh.berths.t=0;sh.berths.tt=0;MOD_EPOCH++;}
function warCargoOff(sh){const w=sh.wcSave;if(!w)return;sh.berths.t=w.t;sh.berths.tt=w.tt;sh.cargo=w.cargo;sh.wcSave=null;MOD_EPOCH++;}

/* ---------- Excess Profits Duty ---------- */
const EPD_RATE={1914:0.5,1915:0.5,1916:0.6,1917:0.8,1918:0.8,1919:0.4,1920:0.6};
/* each January: the year's profit is recorded; in the war years the duty is taken on what it earned above the standard */
function epdJanuary(profit){
  if(!newCal())return;const y=Math.floor(yearOfM(S.m))-1;S.annual=S.annual||{};S.annual[y]=Math.round(profit);
  const rate=EPD_RATE[y];if(!rate)return;
  const pre=[1911,1912,1913].map(k=>S.annual[k]).filter(v=>v!==undefined),avg=pre.length?pre.reduce((a,b)=>a+b,0)/pre.length:0;
  const base=(S.war&&S.war.base)||Math.max(0,netWorth());
  let std=Math.max(avg,0.06*base)*PX()/piAt(ym(1913,6)); // the standard, carried forward at the day's prices
  let earned=profit;if(y===1914){earned=profit-((S.war&&S.war.julyNet)||0);std*=5/12;} // the duty runs from August 1914
  const tax=Math.round(Math.max(0,earned-std)*rate/100)*100;
  if(tax>0){book('tax',-tax);news(`Excess Profits Duty on ${y}: the Line earned ${fmt(Math.round(earned))} against a standard of ${fmt(Math.round(std))}. The Treasury takes ${Math.round(rate*100)}% of the excess, ${fmt(tax)}.`,'bad',true);}
  else news(`Excess Profits Duty on ${y}: the Line earned no more than its standard of ${fmt(Math.round(std))}. Nothing to pay.`);
}

/* ---------- the outbreak page ---------- */
function warModalHTML(){
  const nr=reserveN();
  return `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><div class="panel aftermath stack" style="gap:10px">
    <h3 id="mt">War</h3>
    <p style="margin:0">${dateLong(S.t)}. Britain is at war with Germany. Everything the Line has built its trade on changes today.</p>
    <p style="margin:0"><strong>Passengers vanish.</strong> Emigration stops; within two or three months the cabin trade is down to a fifth or less. Hamburg is closed, and so are the cruises.</p>
    <p style="margin:0"><strong>Freight pays.</strong> Every hold fills, at rates that will climb to about three times their worth before the war. A liner can clear her steerage decks for cargo in the refit office, and put them back after.</p>
    <p style="margin:0"><strong>The state takes ships.</strong> The Admiralty will take a growing share of the fleet for its own service, at a fixed hire well below what freight pays. ${nr?`The Line has ${nr===1?'one ship':nr+' ships'} on its reserve list: you will choose which go, and be paid better.`:'The Line put no ships on the reserve list: the Admiralty will take the biggest and fastest.'}</p>
    <p style="margin:0"><strong>The Treasury takes its share.</strong> Excess Profits Duty takes half of what the Line earns above its pre-war profits, and more as the war goes on. Coal and wages climb, every ship still trading pays the state's war-risk insurance, no yard will take a new order until the war is over; second-hand ships fetch ever more.</p>
    <p class="note" style="margin:0">The dangers at sea, submarines and raiders, come in the next release. For now the war is an economic one.</p>
    <button class="btn primary" data-act="warclose">To work</button></div></div>`;
}
function warClose(){if(S.war)S.war.show=false;if(UI.warPrev>0&&!S.over)UI.speed=UI.warPrev;UI.warPrev=0;}

/* ---------- the Company tab: the reserve list and war service ---------- */
function warHTML(){
  if(!newCal()||S.m<RESERVE_FROM)return '';
  const W=S.war||{},live=S.ships.filter(x=>x.state!=='lost');
  const rows=live.map(sh=>{const st=sh.state==='req'?`<span class="chip bad">${esc(REQ_NAME[sh.req.role].replace(/^an? /,''))}</span> <span class="meta">${fmt(reqHire(sh))} a month</span>`
      :sh.reqDue?'<span class="chip bad">Called up</span>':atWar()?(W.ask?`<button class="btn" data-act="reqpick" data-id="${sh.id}">Offer her</button>`:''):`<label class="check"><input type="checkbox" data-reserve="${sh.id}" ${sh.reserve?'checked':''}> On the reserve list</label>`;
    return `<div class="uprow"><div><strong>SS ${esc(sh.name)}</strong><div class="meta">${int(sh.grt)} tons · ${knotsOf(sh)} knots${sh.adm?' · Admiralty terms':''}</div></div>${st}</div>`;}).join('');
  const intro=atWar()?`The Admiralty has ${reqCount()} of the Line's ships on war service and wants about ${Math.round(reqShare(S.m)*live.length)}. ${W.ask?`It needs ${W.ask.n} more: offer the ships you would rather lose, or it chooses in a month.`:''}`
    :S.m<WAR_FROM?'Ships on the list may be called up if war comes. A line that volunteers chooses which ships go and is paid better. Ships built on Admiralty terms go first whatever you choose.'
    :'The war is over. Requisitioned ships come home through 1919.';
  return `<section class="sec"><h2>${atWar()?'War service':'The Admiralty\'s reserve list'}</h2><p class="note">${intro}</p><div class="stack" style="gap:2px">${rows}</div></section>`;
}
