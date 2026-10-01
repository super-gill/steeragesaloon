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
const WAR_FREIGHT=[[ym(1914,6),1],[ym(1914,7),1.1],[ym(1915,0),1.15],[ym(1916,0),1.2],[ym(1917,0),1.1],[ym(1918,10),1.05],[ym(1919,0),1.2],[ym(1919,6),1.3],[ym(1920,3),1.3],[ym(1920,7),1.15],[ym(1920,10),1.05],[ym(1920,11),1]]; // 0.33: trimmed, war growth was twice the target
const WAR_COAL=[[ym(1914,6),1],[ym(1914,7),1.2],[ym(1916,0),1.55],[ym(1918,0),1.8],[ym(1919,0),1.6],[ym(1920,11),1.1]];
const WAR_WAGE=[[ym(1914,6),1],[ym(1914,9),1.1],[ym(1916,0),1.25],[ym(1918,0),1.4],[ym(1919,6),1.3],[ym(1920,11),1.1]];
const WAR_SHIPS=[[ym(1914,6),1],[ym(1914,7),1.05],[ym(1915,0),1.2],[ym(1916,0),1.4],[ym(1917,0),1.6],[ym(1919,0),1.8],[ym(1919,9),2.3],[ym(1920,3),2.6],[ym(1920,8),2.3],[ym(1920,10),1.8],[ym(1920,11),1.3]]; // over and above prices, which themselves more than double; the bubble tops out in the spring of 1920 and the crash comes that winter
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
const warCargoVol=m=>atWar(m)?1.25:pre21(m)?1.1:1;
const reqShare=m=>atWar(m)?curveAt(REQ_SHARE,m):0;
/* passengers in wartime, as a multiple of what they would have been: the collapse takes two or three months */
function warPax(c,rk,m){
  if(!pre21(m))return 1;const r=ROUTES[rk];
  let w=c==='t'||c==='tt'?(m<US_WAR?0.25:0.1):m<US_WAR?0.3:0.18; // steerage: a quarter of the pre-war trade until America is in the war (US immigration 1915-16), a tenth after
  if(r.group!=='North Atlantic'&&r.group!=='Canada'&&c!=='t')w*=1.6; // colonial and business travel to the south holds up better
  w=Math.min(1,w);
  if(c!=='t'&&c!=='tt'&&m>=LUSITANIA&&m<LUSITANIA+6&&(r.group==='North Atlantic'||r.group==='Canada'))w*=0.8; // after the liner is sunk off Ireland
  if(m<=ARMISTICE){const k=m-WAR_FROM;return k===0?1-(1-w)*0.5:k===1?1-(1-w)*0.8:w;}
  const back=w+(1-w)*Math.min(1,(m-ARMISTICE)/12); // back to the pre-war trade over the year after the armistice
  return back*((c==='t'||c==='tt')&&m>=ym(1920,0)&&(r.group==='North Atlantic'||rk==='nap')?1.3:1); // 1920: the rush to cross before the American quotas
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
  if(m===ARMISTICE+1&&!W.over){W.over=true;news('The war is over: the armistice was signed on the eleventh of November, and the guns fell silent at eleven o\'clock. The Admiralty will return requisitioned ships over the coming year.','hist',true);}
  if(atWar(m))reqMonth();
  if(m>=ym(1919,2)&&m<ym(1920,0))reqReturns();
  for(const sh of S.ships.slice())if(sh.state==='req')reqWear(sh);
  if(atWar(m))warSeaMonth();
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
  const d=sh.reqDue;if(!d)return;S.war.hadReq=true;sh.reqDue=null;sh.req={role:d.role,gw:d.gw,since:S.m,line:sh.line};
  if(sh.pendingYard){sh.pendingYard=null;sh.yardAdd=[];}sh.line=null;sh.state='req';sh.load=null;sh.stopLeft=0;
  wire(sh,`SS ${sh.name} taken up by the Admiralty as ${REQ_NAME[d.role]}. Crew signed on for war service.`,'');
}
/* the Line asks: which ships go (called from the Needs attention card) */
function reqChoose(id){const W=S.war;if(!W||!W.ask)return;const sh=S.ships.find(x=>x.id===id);if(!sh||sh.state==='req'||sh.reqDue)return;
  reqTake([sh],true,'Offered by the Line');W.ask.n--;if(W.ask.n<=0)W.ask=null;W.gw=(W.gw||0)+1;}
/* each month on service: the hire, hard wear, a little standing for the Line */
function reqWear(sh){
  if(reqLoss(sh))return;
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

/* ================= WAR AT SEA (0.27) =================
   Raiders on the southern trades in 1914; submarines from 1915, at their worst in the spring of 1917 when the war on
   merchant ships becomes unrestricted; convoys from June 1917. An attack plays out through the emergency window: the
   master (or the owners, by wireless) chooses how to meet it. A hit becomes a flooding emergency like any other.
   The state's war-risk scheme pays four fifths of a ship lost to the enemy; a private top-up on her insurance panel
   covers the rest. Ships on war service can be lost too; the state pays an agreed value close to her pre-war worth.
   Protections, each with its price: convoy (fewer attacks, slower), speed (a ship of 20 knots is rarely caught),
   zigzagging (fewer hits, longer passages), dazzle paint (fewer hits), a gun and naval gunners (needs the Admiralty's
   goodwill), wireless kept day and night (routing warnings), and a good deck crew (lookouts). */
const SUB_FROM=ym(1915,1),UNRESTRICTED=ym(1917,1),CONVOY_FROM=ym(1917,5),DAZZLE_FROM=ym(1917,2),LUSITANIA=ym(1915,4);
/* how dangerous the sea is in a month, relative to 1915 */
function warThreat(m){if(!atWar(m))return 0;if(m<SUB_FROM)return 0.3;if(m<ym(1916,0))return 0.45;if(m<UNRESTRICTED)return 0.6;if(m<ym(1917,7))return 3.0;if(m<ym(1918,0))return 1.8;return 1.1;}
const WAR_ROUTE=rk=>{const g=ROUTES[rk]?ROUTES[rk].group:'';return rk==='nap'?1.4:g==='North Atlantic'||g==='Canada'?1:rk==='waf'||rk==='rpl'?0.6:0.3;};
const convoyOK=()=>atWar()&&S.m>=CONVOY_FROM;
const inConvoy=sh=>!!sh.convoy&&convoyOK()&&knotsOf(sh)<20;
const warGoodwill=()=>reserveN()>0||goodwill()>0||!!(S.war&&S.war.hadReq);
/* the passage is slower in convoy and zigzagging: a factor on her time at sea */
const warSlow=sh=>atWar()&&sh?(inConvoy(sh)?1.2:1)*(sh.zigzag?1.07:1):1;
/* the chance she is attacked on a crossing, and that an attack hits her */
function warAttackP(sh,rk,dist,o){o=o||{};const kn=knotsOf(sh);
  let p=0.04*warThreat(S.m)*WAR_ROUTE(rk)*(dist/3000);
  if(o.convoy??inConvoy(sh))p*=0.3;if(o.zigzag??sh.zigzag)p*=0.85;if(kn>=20)p*=0.3;else if(kn>=18)p*=0.6;if(nightOn(sh))p*=0.8;return p;}
function warHitP(sh,o){o=o||{};let h=0.75;if(o.zigzag??sh.zigzag)h*=0.75;if(o.dazzle??sh.dazzle)h*=0.82;if(o.gun??sh.gun)h*=0.75;
  if(o.convoy??inConvoy(sh))h*=0.7;if(knotsOf(sh)>=20)h*=0.6;h*=clamp(1.1-cwSk(sh,'deck')/250,0.8,1.05);return h;}
/* a rough monthly chance of losing her, for the ship's panel and head office */
function warLossPM(sh,o){const rk=sh.line;if(!rk||!ROUTES[rk]||!atWar()||sh.state==='req')return 0;
  const d=GEO(geoKey(rk,S.m)).dist,per=30/Math.max(3,d/(knotsOf(sh)*24)+4);return per*warAttackP(sh,rk,d,o)*0.75*warHitP(sh,o)*0.8;}
/* at sailing: will the enemy find her this voyage? */
function warRoll(sh,gk,dist,R){
  if(!atWar())return null;const rk=sh.legRoute||sh.line;if(!rk)return null;
  if(S.m<ym(1914,11)&&['rpl','waf','ban','cot'].includes(rk)&&R()<0.005*dist/3000)return {k:'raider',at:dist*(0.25+R()*0.5)};
  if(S.m<SUB_FROM&&!(R()<0.25))return null; // before the submarines, mines and the odd raider
  if(R()<warAttackP(sh,rk,dist)){const x=R();return {k:x<0.15?'mine':x<0.3?'nearby':'uboat',at:dist*(x<0.15?(R()<0.5?0.04:0.94):0.1+R()*0.8)};}
  return null;
}
/* the owners' or master's choice decides the chance of a hit */
function warChoose(e,sh,how){
  let h=warHitP(sh);
  if(how==='run')h*=knotsOf(sh)>=16?0.6:0.85;else if(how==='zig')h*=0.7;else if(how==='fire')h*=0.5;else if(how==='hold')h*=1.05;
  if(e.sos)h*=1.15;
  e.after={at:S.t+(0.3+Math.random()*0.5)/24,hit:Math.random()<clamp(h,0.03,0.97),how};
}
function warResolve(e,sh){
  const a=e.after;e.after=null;
  if(e.k==='raider'){if(a.hit){emSay(e,sh,'Raider alongside. Prize crew aboard. We are ordered into the boats; she is to be sunk.','bad');warEnd(e,sh,'captured');}
    else{emSay(e,sh,'Raider has fallen astern. Lost her in the dark. Proceeding at full speed.','good');warEnd(e,sh,'saved');}return;}
  if(a.how==='ram'){if(!a.hit){const r=Math.round(500*PX()/10)*10;book('charter',r,'_idle',sh);S.rep=clamp(S.rep+5,0,100);
      emSay(e,sh,`Rammed and sank the submarine. Stem damaged, no leak. Proceeding.`,'good');news(`SS ${sh.name} has rammed and sunk a German submarine. The Admiralty pays the Line ${fmt(r)} and the newspapers are full of her master.`,'good',true);
      sh.cond=clamp(sh.cond-6,5,95);warEnd(e,sh,'saved');return;}}
  if(e.k==='nearby'){emSay(e,sh,a.how==='stop'?'All the survivors we could find are aboard. Proceeding.':'Clear of the area. Proceeding.',a.how==='stop'?'good':'');warEnd(e,sh,'saved');return;}
  if(!a.hit){emSay(e,sh,a.how==='fire'?'Opened fire. Submarine dived and has not been seen again. Proceeding.':'Torpedo passed astern. Submarine lost to view. Proceeding.','good');warEnd(e,sh,'saved');return;}
  warEnd(e,sh,'hit');sh.warLoss=true;const t=startEmergency(sh,'torpedo');t.war=true;
}
function warEnd(e,sh,how){e.over=how==='hit'?'hit':how==='captured'?'lost':'saved';e.t1=S.t;sh.em=null;e.dec=null;
  if(how==='captured'){sh.warLoss=true;sh.lost={t:S.t,where:posText(sh),saved:1,lost:0};news(`SS ${sh.name} has been captured by a German raider ${posText(sh)} and sunk. Her crew and passengers were put aboard a neutral steamer and are safe.`,'bad',true);loseShip(sh);}}
/* the nearby ship: stop for her people, or keep on as the Admiralty orders */
function warNearby(e,sh,stop){
  if(stop){S.rep=clamp(S.rep+3,0,100);sh.stopLeft=Math.max(sh.stopLeft||0,0.25);
    if(Math.random()<0.3){emSay(e,sh,'Picked up survivors. Periscope sighted while stopped.','bad');e.k='uboat';e.canOrder=(radioOf(sh)||sh.state==='port');askOrders(e,sh,'x1');return 'Stopping for survivors.';}
    news(`SS ${sh.name} stopped to pick up the survivors of a torpedoed steamer, against the Admiralty's standing orders. The newspapers call her master a hero.`,'good');
    e.after={at:S.t+0.3/24,hit:false,how:'stop'};return 'Stopping for the boats. Survivors coming aboard.';}
  e.after={at:S.t+0.2/24,hit:false,how:'pass'};return 'Keeping on at full speed as ordered. Boats left to the patrols.';
}

/* ---------- the state's scheme and the private top-up ---------- */
const warTopCost=sh=>sh.warTop&&atWar()?shipValue(sh)*0.2*warInsRate(S.m)*2.5*(1+0.2*((S.war&&S.war.losses)||0)):0;
function warClaim(sh){
  const v=shipValue(sh),state=Math.round(v*0.8),top=sh.warTop?Math.round(v*0.2):0,paid=state+top;S.cash+=paid;const bank=payMortgage(sh,paid);sh.claimPaid=paid;
  S.war.losses=(S.war.losses||0)+1;
  return {paid,bank,txt:`The state's war-risk scheme pays ${fmt(state)}${top?` and the private underwriters ${fmt(top)}`:', four fifths of her value'}${bank>100?`; ${fmt(Math.round(bank))} goes straight to the mortgagees`:''}. The Line keeps ${fmt(Math.round(paid-bank))}. No yard will build her replacement until the war is over.`};
}
/* on war service: the state's ships are lost too, and it pays an agreed value close to her pre-war worth */
function reqLoss(sh){
  if(Math.random()>0.0013*warThreat(S.m))return false;
  const v=Math.round(shipValue(sh)/warShips(S.m)/100)*100;S.cash+=v;const bank=payMortgage(sh,v);admRepay(sh);S.war.losses=(S.war.losses||0)+1;
  const how={amc:'in action with a German cruiser',hospital:'by a mine off the French coast',troop:'by a submarine in the Mediterranean',transport:'by a submarine in the Western Approaches'}[sh.req.role];
  news(`SS ${sh.name}, on war service as ${REQ_NAME[sh.req.role]}, has been sunk ${how}. The Admiralty pays the agreed value, ${fmt(v)}${bank>100?`, ${fmt(Math.round(bank))} of it to the mortgagees`:''}.`,'bad',true);
  fleetGone(sh,'lost',`sunk on war service ${how}`);
  S.ships=S.ships.filter(x=>x!==sh);if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;return true;
}
/* the headlines of the war at sea */
function warSeaMonth(){
  const m=S.m;
  if(m===ym(1914,11))news('The German cruisers raiding the southern trades have been hunted down. The Falklands battle ends the raiders\' war for now.','hist');
  if(m===SUB_FROM)news('Germany declares the waters round Britain a war zone. Her submarines will sink merchant ships on sight.','hist',true);
  if(m===LUSITANIA&&!S.war.lus){S.war.lus=true;const L=S.rships.filter(x=>RIVAL_P[x.owner]&&!RIVAL_P[x.owner].kind&&/British/.test((RIVALS[x.owner]||{}).flag||'')).sort((a,b)=>b.knots-a.knots)[0];
    if(L){S.rships=S.rships.filter(x=>x!==L);RW_CACHE.k=null;S.rmoves.unshift({m,o:L.owner,rk:L.route,kind:'lost',ship:L.name});(S.retired=S.retired||[]).push(L.name);if(coAlive(L.owner))coPay(L.owner,Math.round(coShipVal(L)*0.2));
      news(`${RIVALS[L.owner].name}'s SS ${L.name} has been torpedoed without warning off the south coast of Ireland and sank in eighteen minutes. 1,198 were lost, 128 of them Americans. America is outraged; fewer cabin passengers will cross.`,'hist',true);}}
  if(m===UNRESTRICTED)news('Germany declares unrestricted submarine warfare: every ship in the war zone, neutral or not, will be sunk without warning. Losses this spring will be the worst of the war.','hist',true);
  if(m===CONVOY_FROM)news('The Admiralty begins to sail merchant ships in escorted convoys. Slower, but far fewer are lost. Each ship\'s panel can put her in convoy.','hist',true);
}
/* ---------- the ship's panel: war at sea ---------- */
function warSeaHTML(sh){
  if(!atWar()||sh.state==='req')return '';
  const pm=warLossPM(sh),yr=1-Math.pow(1-pm,12);
  const fit=(k,lab,ok,note)=>sh[k]?`<span class="chip sea">${lab}</span>`:ok?`<button class="btn" data-act="refit" data-d='[${sh.id},"${k}"]' style="width:fit-content">${lab} · ${fmt(refitCost(sh,k))}, ${yardDays(sh,k)} days</button>`:`<span class="note">${note}</span>`;
  return `<div class="ctl"><span class="lbl">Her risk</span><span class="note">${sh.line?(()=>{const d=GEO(geoKey(sh.line,S.m)).dist,cr=warAttackP(sh,sh.line,d)*0.75*warHitP(sh)*0.8;return `On ${ROUTES[sh.line].name}, about ${cr<0.01?'1 in '+Math.max(100,Math.round(1/Math.max(cr,1e-4)/10)*10):Math.round(cr*100)+' in 100'} crossings like hers end in her loss${warThreat(S.m)>=1.5?', at the worst of the danger':''}.${isFinite(yr)?` Kept on this trade for a year at this month's danger, about ${Math.max(1,Math.round(yr*100))}%.`:''}`;})():'Laid up, she is safe.'} ${knotsOf(sh)>=20?'At her speed a submarine can rarely catch her.':''}</span></div>
    <div class="ctl"><span class="lbl">Zigzag</span>${seg('shipset','zigzag',sh.zigzag?1:0,['Straight','Zigzag'])}<span class="note">Fewer hits; passages about 7% longer and more coal.</span></div>
    <div class="ctl"><span class="lbl">Convoy</span>${convoyOK()?(knotsOf(sh)>=20?'<span class="note">Too fast for the convoys: she sails alone.</span>':seg('shipset','convoy',sh.convoy?1:0,['Alone','In convoy'])+'<span class="note">Far fewer attacks, and escorts; passages about a fifth longer.</span>'):'<span class="note">No convoys yet.</span>'}</div>
    <div class="ctl"><span class="lbl">Fittings</span><div class="btns">${fit('dazzle','Dazzle paint',S.m>=DAZZLE_FROM,'Dazzle paint comes in 1917.')}${fit('gun','A gun and naval gunners',warGoodwill(),'A gun needs the Admiralty\'s goodwill: put ships on its list or on war service.')}</div></div>
    <div class="ctl"><span class="lbl">War-risk insurance</span>${seg('shipset','warTop',sh.warTop?1:0,['State scheme only','Private top-up'])}<span class="note">The state pays four fifths of her value if the enemy sinks her (${fmt(warInsCost(sh))} a month). A private top-up covers the rest for ${fmt(shipValue(sh)*0.2*warInsRate(S.m)*2.5*(1+0.2*((S.war&&S.war.losses)||0)))} a month, dearer after every loss in the fleet.</span></div>`;
}

/* ================= THE BUBBLE, 1919 AND 1920 (0.28) =================
   The ships come home and the world wants tonnage: second-hand ships fetch two and a half times their pre-war worth over
   and above prices by the spring of 1920, buyers make offers for the Line's ships, new building opens again at
   inflated prices, freight stays high and the emigrants rush to cross before the American quotas. Speculative lines
   are floated on borrowed money. The German lines' big ships are handed over as reparations, and two are auctioned.
   In the winter of 1920 it breaks: from January 1921 the game carries on as the 1921 game, crash and all. A ship sold
   at the top fetches two to three times her 1913 worth at 1913 prices; held through 1921 she loses half to two thirds. */
const PEACE=ym(1919,0),VERSAILLES=ym(1919,5),AUCTION_CLOSE=ym(1919,9);
/* building again, from 1919, at prices well over the general rise, until the crash */
/* new building in the boom: with every yard full, a new ship costs what one on the market fetches, so a ship ordered
   in 1919 gains on delivery only what the market has risen since (0.35.6; it was 1.3 to 1.6, and a ship ordered in
   January 1919 sold for twice her price in 1920) */
const warBuild=m=>newCal()&&m>ARMISTICE&&m<M21?Math.max(1,warShips(m)):1;
/* the ironmoulders' strike, 22 September 1919 to January 1920: no castings, and the yards all but stop */
const moulders=()=>newCal()&&S.m>=ym(1919,8)&&S.m<ym(1920,1);
const bubbleOn=m=>{m=m===undefined?S.m:m;return newCal()&&m>=ym(1919,1)&&m<ym(1920,9);};
function bubbleMonth(){
  const m=S.m,W=S.war;if(!newCal()||m<PEACE||m>=M21)return;
  if(m===PEACE)news('The yards are taking orders again, at prices nobody has seen before. Shipowners who kept their ships are rich on paper; every broker in the City has a buyer.','hist',true);
  if(m===VERSAILLES&&!W.rep)reparations();
  if(W.auction&&m>=W.auction.close)auctionClose();
  if(m===ym(1919,8))news('The ironmoulders have come out on strike. Without castings the shipyards can do little more than wait; every ship on the stocks will be late.','bad',true);
  if(m===ym(1920,3))news('Ship prices are at their height. Some owners are selling while buyers will pay anything; others are ordering new tonnage at record prices.','hist',true);
  if(m===ym(1920,9))news('Freight rates are falling fast. Ships are laying up in every port, and the bankers are beginning to worry about the loans they made on inflated tonnage.','bad',true);
  // buyers' offers for the Line's ships
  if(bubbleOn(m)){W.offers=(W.offers||[]).filter(o=>o.exp>m&&S.ships.some(x=>x.id===o.sid));
    for(const sh of S.ships){if(sh.state==='req'||sh.state==='lost'||W.offers.some(o=>o.sid===sh.id)||Math.random()>0.07)continue;
      // a syndicate looks the ship up: one the Line has had under a year is offered no more than she cost, moved with the market (0.35.6)
      const amt=Math.round(Math.min(shipValue(sh)*(1.1+Math.random()*0.3),saleCap(sh))/1000)*1000;if(amt<=saleValue({...sh,saleAmt:0}))continue;W.offers.push({sid:sh.id,amt,exp:m+2});
      news(`A syndicate offers ${fmt(amt)} for SS ${sh.name}, about ${Math.round(amt/Math.max(1,shipValue(sh)/warShips(m)*piAt(ym(1913,6))/PX())*10)/10} times her pre-war worth. It is under Needs attention.`,'',true);}}
  else if(W.offers&&W.offers.length)W.offers=[];
  // speculative lines floated on borrowed money
  if(bubbleOn(m)&&Math.random()<0.15){S.coQueue=S.coQueue||[];S.coQueue.push({at:m,kind:Math.random()<0.5?'cargo':'liner',routes:[],spec:true});}
}
/* the offer taken: she goes now if she is in port, or when she next reaches port */
function offerTake(sid,yes){const W=S.war;if(!W||!W.offers)return;const o=W.offers.find(q=>q.sid===sid);if(!o)return;W.offers=W.offers.filter(q=>q!==o);
  const sh=S.ships.find(x=>x.id===sid);if(!sh||!yes)return;
  sh.saleAmt=o.amt;const v=saleValue(sh); // a ship held under a year is capped like any other sale (0.35.6)
  if(sh.state==='sea'||sh.state==='repo'){sh.pendingExit='sell';news(`SS ${sh.name} is sold for ${fmt(v)}. The buyers take her when she reaches port.`,'good');}
  else exitShip(sh,'sell');}
/* the Treaty of Versailles: the German lines hand over their big ships; the two largest are auctioned */
function reparations(){
  const W=S.war;W.rep=true;const G=S.rships.filter(x=>/German/.test((RIVALS[x.owner]||{}).flag||'')&&x.grt>=8000).sort((a,b)=>b.grt-a.grt);if(!G.length)return;
  const takers=coLive().filter(o=>!/German/.test((RIVALS[o]||{}).flag||'')&&!RIVAL_P[o].kind).sort((a,b)=>coWorth(b)-coWorth(a)).slice(0,3);
  const lots=G.slice(0,2),rest=G.slice(2);
  for(const x of rest){const t=takers[Math.floor(Math.random()*takers.length)];if(!t){dropRival(x);continue;}x.owner=t;S.rmoves.unshift({m:S.m,o:t,rk:x.route,kind:'add',ship:x.name});}
  for(const x of lots){S.rships=S.rships.filter(y=>y!==x);}
  RW_CACHE.k=null;
  W.auction={close:AUCTION_CLOSE,lots:lots.map(x=>({name:x.name,built:x.built,grt:x.grt,knots:x.knots,berths:{...x.berths,tt:x.berths.tt||0},cargo:x.cargo,route:x.route,from:x.owner,
    value:Math.round(x.grt*CO_PRICE*PX()*Math.max(0.25,1-(yearOfM(S.m)-x.built)/35)*warShips(S.m)/1000)*1000,bid:0}))};
  news(`Under the peace treaty the German lines hand over every big ship they have. ${rest.length?`${rest.length} go to the Allied lines; `:''}${lots.map(l=>'SS '+l.name).join(' and ')} ${lots.length>1?'are':'is'} to be auctioned by the Reparations Commission, bids by ${monthName(AUCTION_CLOSE)}. See Buy and build.`,'hist',true);
}
function auctionBid(i,k){const A=S.war&&S.war.auction;if(!A||rescueNoBuy())return;const L=A.lots[i];if(!L)return;const amt=Math.round(L.value*[0.8,1,1.3][k]/1000)*1000;
  if(S.cash+headroom()<amt*0.3)return;L.bid=amt;}
function auctionClose(){
  const A=S.war.auction;S.war.auction=null;
  for(const L of A.lots){const rival=Math.round(L.value*(0.85+Math.random()*0.5)/1000)*1000;
    // the bank advances half against her; the rest must be in the Line's account at the close, or the bid fails (0.35.7)
    const mortQ=L.bid?Math.min(Math.round(L.bid*0.5),Math.max(0,Math.round(headroom()))):0;
    if(L.bid&&L.bid>=rival&&S.cash+mortQ<L.bid){news(`The Line cannot find the ${fmt(L.bid)} it bid for SS ${L.name}. The Commission takes the next bid, and the City notes it.`,'bad',true);S.rep=clamp(S.rep-2,0,100);L.bid=0;}
    if(L.bid&&L.bid>=rival){
      const sh=makeShip({name:L.name,built:L.built,grt:L.grt,knots:L.knots,berths:L.berths,cargo:L.cargo,fuel:'coal',base:Math.round(L.bid/(PX()*warShips(S.m))),note:'Bought from the Reparations Commission.'},72,'SOU');
      sh.up.wireless=true;sh.up.boats=true;sh.paint=oldOwnerPaint(sh);sh.acq=S.m;sh.paid=L.bid;sh.mk0=shipIdx();S.ships.push(sh);S.cash-=L.bid;
      const mort=mortQ;if(mort>0){S.debt+=mort;S.cash+=mort;}
      news(`The Line's bid of ${fmt(L.bid)} wins SS ${L.name}, ${int(L.grt)} tons and ${L.knots} knots. She lies at Southampton; the bank advances ${fmt(mort)} on her.`,'good',true);}
    else{const t=coLive().filter(o=>!/German/.test((RIVALS[o]||{}).flag||'')&&!RIVAL_P[o].kind).sort((a,b)=>coWorth(b)-coWorth(a))[0];
      if(t){const x=makeRivalShip(t,L.route==='ham'?'liv':L.route,L.built);Object.assign(x,{name:freshName(L.name),grt:L.grt,knots:L.knots,berths:L.berths,cargo:L.cargo});S.rships.push(x);newRivalVis(x);coPay(t,rival);RW_CACHE.k=null;}
      news(`SS ${L.name} goes to ${t?RIVALS[t].name:'an American buyer'} for ${fmt(rival)}${L.bid?`, over the Line's ${fmt(L.bid)}`:''}.`,L.bid?'bad':'');}}
}
function auctionHTML(){
  const A=S.war&&S.war.auction;if(!A)return '';
  return `<section class="sec"><h2>The Reparations Commission's auction</h2><p class="note">Sealed bids by ${monthName(A.close)}. The highest wins; the Allied lines are bidding too. You need about three tenths of your bid to hand; the bank lends on the rest. The values are boom prices: ships bought now are worth far less when the boom ends.</p>
    ${A.lots.map((L,i)=>`<div class="card"><div class="row"><strong>SS ${esc(L.name)}</strong><span class="num">worth about ${fmt(L.value)}</span></div>
      <div class="meta">Built ${L.built} · ${int(L.grt)} grt · ${L.knots} knots · ${int((L.berths.f||0)+(L.berths.s||0)+(L.berths.t||0))} passengers · ${int(L.cargo)} t cargo · late of ${esc(RIVALS[L.from]?RIVALS[L.from].name:'a German line')}</div>
      <div class="btns">${[0,1,2].map(k=>{const a=Math.round(L.value*[0.8,1,1.3][k]/1000)*1000;return `<button class="btn" data-act="abid" data-d='[${i},${k}]' aria-pressed="${L.bid===a}" ${S.cash+headroom()<a*0.3||S.over?'disabled':''}>${['Low bid','Fair bid','High bid'][k]} · ${fmt(a)}</button>`;}).join('')}</div>
      ${L.bid?`<p class="note">Your bid: ${fmt(L.bid)}.</p>`:''}</div>`).join('')}</section>`;
}
