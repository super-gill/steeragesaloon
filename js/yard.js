/* ================= SHIPBUILDING =================
   A new ship is designed in the drawing office, ordered from a builder, waits for a slip, is framed, plated, launched,
   fitted out and run over the measured mile before she is handed over. Prices are staged; the work stops if you cannot pay. */
/* cx: how much a hull of this kind costs against a plain one. Raised for passenger ships in 0.39.1 from the sources on build costs:
   intermediate and tourist liners of the 1920s and 30s cost about £51-61 a gross ton (Mongolia 1923, Minnewaska 1923,
   Viceroy of India 1929, Andes 1939), the game's about £35-50; a 1913 emigrant liner about £24 (Ceramic); a cargo liner
   £12-13 in 1906-13 (Clan Matheson, Clan Mactavish) and £35 by 1939 (Port Quebec) */
const PURPOSES={
  express:{name:'Express mail liner',size:[18000,85000],speed:[19,31],mix:{f:40,s:25,t:35,tt:0},pax:0.9,cx:1.25,
    blurb:'Speed and splendour for the richest trades. Ruinously dear, and the pride of a line.'},
  inter:{name:'Intermediate liner',size:[8000,30000],speed:[13,21],mix:{f:26,s:26,t:48,tt:0},pax:0.82,cx:1.3,
    blurb:'The workhorse: steady speed, big capacity in every class and a fair cargo.'},
  emig:{name:'Emigrant ship',size:[6000,20000],speed:[12,17],mix:{f:4,s:14,t:82,tt:0},pax:0.85,cx:1.2,
    blurb:'Plain, roomy and economical. Built to carry as many steerage passengers as the law allows.'},
  tourist:{name:'Tourist liner',from:1927,size:[10000,35000],speed:[15,23],mix:{f:25,s:0,t:0,tt:75},pax:0.88,cx:1.35,
    blurb:'For the new tourist class: students, teachers and holidaymakers who want comfort without the price of first.'},
  mixed:{name:'Passenger-cargo liner',size:[5000,16000],speed:[12,18],mix:{f:40,s:30,t:30,tt:0},pax:0.42,cx:1.2,
    blurb:'Half passenger ship, half cargo ship, for the colonial and South American trades.'},
  cargo:{name:'Cargo liner',size:[4000,14000],speed:[10,18],mix:{f:100,s:0,t:0,tt:0},pax:0.05,cx:1.2,
    blurb:'Big holds and a dozen cabins. Earns her keep on freight.'},
  cruise:{name:'Cruise ship',from:1928,size:[5000,30000],speed:[13,20],mix:{f:45,s:20,t:0,tt:35},pax:0.8,cx:1.12,cruiser:true,
    blurb:'White, airy and built for pleasure: cabins, sun decks, pools and public rooms, and no steerage at all. Made for the cruises, though she can run a line in the off season.'},
  reefer:{name:'Refrigerated ship',size:[3500,15000],speed:[13,21],mix:{f:70,s:30,t:0,tt:0},pax:0.12,cx:1.1,reefer:true,
    blurb:'Fast insulated holds for bananas and chilled beef.'}
};
const HULLFORMS={
  trad:{name:'Straight stem, counter stern',eff:1,cost:1,blurb:'The old way. Cheap to draw and cheap to build.'},
  cruiser:{name:'Raked stem, cruiser stern',eff:0.95,cost:1.03,blurb:'A longer waterline for the same length: easier to drive.'},
  maier:{name:'Maierform bow',from:1927,eff:0.9,cost:1.06,blurb:'A patent V-section bow that parts the sea cleanly. Saves fuel.'},
  bulb:{name:'Bulbous bow',from:1929,eff:0.86,cost:1.08,blurb:'A submerged bulb that cancels the bow wave at speed. Best on fast ships.'},
  tank:{name:'Tank-tested fine form',from:1948,eff:0.8,cost:1.12,blurb:'Lines refined in the model basin over hundreds of runs.'}
};
const SUBDIV={
  std:{name:'Standard subdivision',cost:1,safety:1,blurb:'Watertight bulkheads to the rules.'},
  enh:{name:'Enhanced subdivision',cost:1.05,safety:0.45,blurb:'Extra bulkheads and a double skin at the machinery spaces. She is much harder to sink.'}
};
const MACHINES={
  recip:{name:'Triple-expansion engines',fuels:['coal','oil'],max:y=>17,eff:1.05,crew:1,cost:0.85,rel:1,blurb:'Simple, sturdy reciprocating engines. Slow and thirsty, but any engineer can mend them.'},
  quad:{name:'Quadruple-expansion engines',fuels:['coal','oil'],max:y=>18,eff:0.97,crew:1,cost:0.95,rel:1,blurb:'A fourth stage wrings more work from the steam.'},
  turb:{name:'Direct-drive turbines',from:1905,fuels:['coal','oil'],max:y=>30,eff:1.08,crew:1,cost:1.05,rel:1.05,blurb:'Smooth and powerful at full speed, wasteful when slowed.'},
  geared:{name:'Geared turbines',from:1911,fuels:['oil','coal'],max:y=>32,eff:0.92,crew:0.95,cost:1.12,rel:1,blurb:'Turbines geared down to slower propellers. The modern choice.'},
  turbel:{name:'Turbo-electric drive',from:1928,fuels:['oil'],max:y=>31,eff:0.9,crew:0.95,cost:1.25,rel:0.9,appeal:1.03,blurb:'Turbines drive generators, motors turn the shafts. Quiet, smooth and reliable.'},
  motor:{name:'Diesel motor engines',from:1924,fuels:['oil'],max:y=>Math.min(26,17+Math.max(0,y-1926)*0.4),eff:0.6,crew:0.8,cost:1.22,rel:1.05,appeal:y=>y<1938?0.97:1,
    blurb:'Burns a third of the fuel of steam and needs no stokers. Early motors shake the saloons.'},
  atomic:{name:'Nuclear reactor and turbines',from:1966,fuels:['oil'],max:y=>34,eff:0.05,crew:0.9,cost:2.4,rel:0.92,blurb:'No bunkers, ever. The price is eye-watering and the insurers are nervous.'},
  hp:{name:'High-pressure turbines',from:1950,fuels:['oil'],max:y=>35,eff:0.78,crew:0.85,cost:1.3,rel:0.95,blurb:'Steam at pressures the old engineers would not believe.'}
};
const QUALITY=[
  {name:'Plain',appeal:0.9,cost:0.7,decay:1.3,space:0.9,blurb:'Serviceable, hard-wearing, forgettable.'},
  {name:'Good',appeal:1,cost:1,decay:1,space:1,blurb:'What passengers expect of a good line.'},
  {name:'Luxurious',appeal:1.15,cost:1.6,decay:0.9,space:1.15,blurb:'Panelled saloons, private baths in the best cabins.'},
  {name:'Palatial',appeal:1.3,cost:2.6,decay:0.8,space:1.35,blurb:'A floating grand hotel. The newspapers will print the menus.'}
];
const STYLES={
  edw:{name:'Edwardian',blurb:'Oak, plaster ceilings and potted palms.'},
  deco:{name:'Art Deco',from:1925,blurb:'Lacquer, chrome, geometric glass: the style of the Paris Exposition.'},
  moderne:{name:'Streamline Moderne',from:1933,blurb:'Curves, indirect light and long horizontal lines.'},
  contemp:{name:'Contemporary',from:1950,blurb:'Light woods, bright fabrics, modern art on the bulkheads.'}
};
/* what passengers think of each style as the years pass */
function fashion(style,y){
  if(!style)return 1;
  if(style==='edw')return y<1924?1:Math.max(0.86,1-(y-1924)*0.01);
  if(style==='deco')return y<1929?1.04:y<1938?1.08:Math.max(0.9,1.08-(y-1938)*0.012);
  if(style==='moderne')return y<1937?1.06:y<1948?1.1:Math.max(0.92,1.1-(y-1948)*0.012);
  if(style==='contemp')return 1.08;
  return 1;
}
const EXTRAS={
  wireless:{name:'Wireless telegraphy',cost:()=>2500,blurb:'A set and two operators keeping watch.'},
  boats:{name:'Boats for all',cost:g=>g*0.08+1000,blurb:'Lifeboats for everyone aboard, not just the legal scale.',ok:()=>newCal()},
  reefer:{name:'Refrigerated holds',cost:g=>g*2+4000,blurb:'Insulated holds for fruit and meat.'},
  hatch:{name:'More hatches and tween decks',cargo:true,cost:g=>g*0.8,blurb:'Cargo worked through more hatches at once: handling a quarter cheaper, half a day off each turnaround.'},
  heavy:{name:'Heavy-lift derricks',cargo:true,cost:()=>7000,blurb:'Locomotives and machinery: general cargo and manufactures pay about 12% more.'},
  deep:{name:'Deep tanks',cargo:true,cost:g=>g*0.6,blurb:'Palm oil and liquids in bulk: palm oil pays about 30% more.'},
  stab:{name:'Gyro stabilisers',from:1932,cost:g=>g*1.6,fs:1.03,gale:0.6,blurb:'Great spinning wheels that damp the roll.'},
  rphone:{name:'Radio-telephone',from:1936,cost:()=>7000,fs:1.02,blurb:'Passengers can telephone ashore from mid-ocean.'},
  aircon:{name:'Air conditioning',from:1937,cost:g=>g*1.3,fs:1.03,tropic:1.06,blurb:'Cooled public rooms: a boon in the tropics.'},
  radar:{name:'Radiolocation set',from:1946,cost:()=>32000,risk:0.7,blurb:'Sees other ships and ice through fog and darkness.'},
  fins:{name:'Fin stabilisers',from:1954,cost:g=>g*2,fs:1.05,gale:0.4,blurb:'Retractable fins that all but stop the roll.'}
};
/* hull layouts: how a ship is arranged, and so how she looks. A liner's decks of white superstructure; a tramp's three
   islands and well decks; a cargo liner's centre castle and cargo posts; a modern motor ship; a white fruit ship.
   The drawing office offers the layouts that suit her purpose and the year; older ships are classified by what they carry. */
const LAYOUTS={
  classic:{name:'Classic liner',blurb:'Tall funnels and deck upon deck of white superstructure.'},
  stream:{name:'Streamlined liner',from:1930,fs:1.03,cost:1.03,blurb:'Rounded fronts, fewer and broader funnels, a cruiser stern: the look of the thirties. First class likes it.'},
  modern:{name:'Post-war liner',from:1950,fs:1.05,cost:1.04,blurb:'One great funnel, a raked stem and a sleek house. The height of fashion.'},
  island:{name:'Three-island tramp',to:1945,cost:0.92,cargo:0.97,blurb:'Raised bow, bridge and stern with well decks between. Cheap to build; the wells cost a little space.'},
  castle:{name:'Centre-castle cargo liner',blurb:'A long raised midship section with a white house, and cargo posts at every hatch.'},
  motor:{name:'Modern motor ship',from:1945,cost:1.03,cargo:1.03,blurb:'Raked stem, streamlined house and a squat funnel; a little more room in her holds.'},
  fruit:{name:'Fruit ship',blurb:'White hull to keep the holds cool, a fine bow and a neat house amidships.'}
};
const LAYOUT_FOR={express:['classic','stream','modern'],inter:['classic','stream','modern'],emig:['classic','stream','modern'],tourist:['classic','stream','modern'],cruise:['classic','stream','modern'],
  mixed:['castle','classic','stream','modern'],cargo:['island','castle','motor'],reefer:['fruit','castle','motor']};
const layoutOk=(k,y)=>{const l=LAYOUTS[k];return !!l&&(!l.from||y>=l.from)&&(!l.to||y<l.to);};
function defaultLayout(pk,y){
  const pref={cargo:y<1930?'island':y<1948?'castle':'motor',reefer:'fruit',mixed:'castle'}[pk]||(y>=1950?'modern':y>=1932?'stream':'classic');
  return layoutOk(pref,y)?pref:(LAYOUT_FOR[pk]||['classic']).find(k=>layoutOk(k,y))||'classic';
}
function layoutOf(sh){
  if(sh.design&&sh.design.layout)return sh.design.layout;
  const b=sh.berths||{},pax=(b.f||0)+(b.s||0)+(b.t||0)+(b.tt||0),y=sh.built||1900;
  if(pax<60)return sh.up&&sh.up.reefer&&(sh.cargo||0)<9000?'fruit':y<1930?'island':y<1948?'castle':'motor';
  if(pax<400&&(sh.cargo||0)>2000)return 'castle';
  return y>=1950?'modern':y>=1932?'stream':'classic';
}
const BUILDERS={
  clyde:{name:'Clydebank Engineering and Shipbuilding',port:'GLA',price:1,speed:1,quality:1.04,slips:3,max:90000,blurb:'Builders of record-breakers. Dear, and worth it.'},
  mersey:{name:'Birkenhead Iron Works',port:'LIV',price:0.97,speed:1,quality:1,slips:2,max:45000,blurb:'Solid Mersey work for the Liverpool lines.'},
  solent:{name:'Woolston Yard',port:'SOU',price:0.93,speed:1.08,quality:0.97,slips:2,max:30000,blurb:'Quick and keen on price. Smaller slips.'},
  elbe:{name:'Elbe-Werft',port:'HAM',price:0.9,speed:0.95,quality:1.03,slips:3,max:90000,blurb:'Fine German engineering, if you can stomach the newspapers.'},
  liguria:{name:'Cantieri di Sestri',port:'GEN',price:0.85,speed:1.15,quality:0.95,slips:2,max:50000,blurb:'Cheap Italian labour and handsome interiors. Slow.'}
};
const OWN_SLIP_COST=250000;
const techOn=(from,y)=>!from||y>=from;
/* oil firing comes in with the post-war conversions; before 1919 every new ship burns coal */
const OIL_FROM=1919;
const fuelOK=(f,y)=>f!=='oil'||y>=OIL_FROM;
/* the biggest ship any slip could take, year by year: 20,000 tons in 1900, the 50,000-ton giants of 1911, 90,000 by 1930 */
const slipMaxYear=y=>y<1900?18000:y<1907?20000+(y-1900)*1000:y<1911?27000+(y-1907)*6000:y<1921?50000+(y-1911)*1000:y<1930?60000+(y-1921)*3400:90000;
const builderMax=B=>Math.min(B.max,Math.round(slipMaxYear(yNow())/1000)*1000);
const yNow=()=>yearNow();

/* the public rooms the architects pencil in for each kind of ship, within what her size allows */
function defaultFac(pk,g,y){
  const want={express:{dineF:2,dineS:1,shows:2,pool:1,garden:1,shops:1},inter:{dineF:1,dineS:1,shows:1,garden:1},emig:{dineT:1,family:1},
    tourist:{dineS:1,shows:1,cinema:1},cruise:{dineF:1,pool:1,garden:1,shows:1,shops:1,spa:1},mixed:{dineF:1},cargo:{},reefer:{}}[pk]||{};
  const f={};let n=0;const cap=2+Math.floor(g/8000);
  for(const k in want){let l=want[k];while(l>0&&!levelOk(k,l,g,y))l--;if(l>0&&n+l<=cap){f[k]=l;n+=l;}}
  return f;
}
/* ---------- the design: everything the drawing office works out from the owner's choices ---------- */
function defaultDesign(pk){
  const P=PURPOSES[pk||'inter'],y=yNow();
  const g=Math.round(Math.min(P.size[0]*0.65+P.size[1]*0.35,slipMaxYear(y)*0.8)/500)*500,kn=Math.round(P.speed[0]+(P.speed[1]-P.speed[0])*0.35+shipEraKnots(Math.floor(y)));
  return {purpose:pk||'inter',grt:g,knots:kn,form:y>=1929?'bulb':'cruiser',subdiv:'std',mach:kn>18&&y>=1911?'geared':kn>18&&y>=1905?'turb':'quad',fuel:fuelOK('oil',y)?'oil':'coal',
    mix:{...P.mix},pax:P.pax,quality:1,style:y>=1933?'moderne':y>=1925?'deco':'edw',extras:{wireless:y>=1908,boats:newCal()&&S.m>=ym(1912,4),reefer:!!P.reefer,hatch:pk==='cargo'||pk==='reefer'},
    layout:defaultLayout(pk||'inter',y),fac:defaultFac(pk||'inter',g,y),funnels:g>=30000?3:g>=12000?2:1,builder:'clyde',contract:'fixed',name:'',line:'',auto:{mach:true,form:true}};
}
function builderOf(d){return d.builder==='own'?ownBuilder():BUILDERS[d.builder];}
function ownBuilder(){const p=S.shore&&S.shore.slip;if(!p)return null;
  const exp=S.shore.slipBuilt||0;return {name:`Morven Line yard, ${YARD_PORTS[p]}`,port:p,price:0.8,speed:1.15-Math.min(0.15,exp*0.04),quality:0.95+Math.min(0.08,exp*0.02),slips:1,max:40000,blurb:'Your own slip. Cheaper, and better with every ship you build.'};}
function designStats(d){
  if(d.auto&&(d.auto.mach||d.auto.form)){const r=recommend(d);if(d.auto.mach){d.mach=r.mach;d.fuel=r.fuel;}if(d.auto.form)d.form=r.form;}
  const y=yNow(),P=PURPOSES[d.purpose],M=MACHINES[d.mach],H=HULLFORMS[d.form],Q=QUALITY[d.quality],B=builderOf(d)||BUILDERS.clyde;
  const g=d.grt,kn=d.knots,e=engineer(d),w=e.problems.slice();
  if(g>builderMax(B))w.push(`${B.name} has no slip long enough for ${int(g)} tons (their limit is ${int(builderMax(B))} this year).`);
  if(!fuelOK(d.fuel,yNow()))w.push('No yard will build an oil-fired ship before '+OIL_FROM+'.');
  if(!M.fuels.includes(d.fuel))w.push(`${M.name} burn oil only.`);
  // what is left once engines and bunkers are in is shared between passengers and cargo
  const fc=facChange({fac:{},grt:g,facPlan:null},d.fac||{}),facRoom=FAC_KEYS.reduce((a,k)=>a+((FAC[k].levels[(d.fac||{})[k]||0]||{}).room||0),0);
  if(slotsUsed(d.fac)>slotsOf({grt:g}))w.push(`A ship of ${int(g)} tons has room for ${slotsOf({grt:g})} venues; the plan has ${slotsUsed(d.fac)}.`);
  for(const k of FAC_KEYS){const l=(d.fac||{})[k]||0;if(l&&!levelOk(k,l,g,y))w.push(`${FAC[k].levels[l].n} needs a bigger ship${FAC[k].levels[l].from>y?' or a later year':''}.`);}
  // after the war third class moved from open steerage into cabins, and new ships carried far fewer people a ton (0.39.1):
  // about 5 to 7 tons a berth before the war (Saxonia, Ivernia), 8 to 13 by the late 1920s (Ascania, Laurentic, the Duchesses)
  const cab=clamp((y-1914)/10,0,1),room=Math.max(0,e.usable),paxSpace=Math.max(0,room*d.pax-facRoom),per={f:14*Q.space,s:8*Q.space,t:3.2+2.3*cab,tt:(5.5+2.5*cab)*Q.space},berths={};
  const tot=Math.max(1,d.mix.f+d.mix.s+d.mix.t+d.mix.tt);
  for(const c of ['f','s','t','tt'])berths[c]=Math.round(paxSpace*d.mix[c]/tot/per[c]);
  if(berths.tt&&y<1925)w.push('Tourist class does not exist yet.');
  const LY=LAYOUTS[d.layout]||{};
  if(d.layout&&!layoutOk(d.layout,y))w.push(`${LY.name||'That layout'} is not built any more, or not yet.`);
  const cargo=Math.round((room*(1-d.pax)*1.45+g*0.1)*(LY.cargo||1)/10)*10;
  // costs: a longer, finer hull costs more steel per ton; engines cost by the horsepower
  const hull=g*22*H.cost*SUBDIV[d.subdiv].cost*P.cx*Math.pow(e.len/lenForSize(g),0.7);
  const power=e.shp*MACH_DATA[d.mach].pps*M.cost/1.1;
  // passenger space is the dear part of a liner: cabins, plumbing, galleys and public rooms (0.39.0: about doubled for second and
  // tourist, since new tourist and emigrant ships returned 40% a year on their cost against perhaps half that in fact)
  const interiors=(berths.f*400+berths.s*170+berths.t*35+berths.tt*110)*Q.cost*(d.style==='edw'?1:1.08);
  let extras=fc.cost/PX();for(const k in d.extras)if(d.extras[k]&&EXTRAS[k])extras+=EXTRAS[k].cost(g);
  // the biggest ships cost far more than their tonnage: longer slips, heavier plate, more of everything done once only
  const sizeK=1+0.6*Math.pow(Math.max(0,(g-20000)/40000),1.3);
  const base=(hull*sizeK*(LY.cost||1)+power+interiors+extras)*B.price*(d.contract==='fixed'?1.08:1)*(d.adm&&admEligible(d)?1.05:1)*PX()*warBuild(S.m)*SHIP_K; // naval standards cost a twentieth more; 1919 and 1920 prices are inflated
  const price=Math.round(base/1000)*1000;
  const months=Math.round((6+g/1600)*Math.pow(Math.max(1,e.shp/15000),0.12)*[0.95,1,1.08,1.15][d.quality]*B.speed*Math.sqrt(P.cx));
  // running character: coal or oil a day at service speed, set by her engines and her lines
  const fuelK=e.fuelDay/(g/(d.fuel==='coal'?70:95));
  const crewK=M.crew*(d.fuel==='oil'?0.9:1)*clamp(0.8+e.shp/g*0.25,0.8,1.6);
  let fs=(LY.fs||1)*Q.appeal*(typeof M.appeal==='function'?M.appeal(y):(M.appeal||1)),t=1,gale=1,risk=1/(B.quality*M.rel*1.02);
  for(const k in d.extras)if(d.extras[k]&&EXTRAS[k]){const x=EXTRAS[k];if(x.fs)fs*=x.fs;if(x.t)t*=x.t;if(x.gale)gale*=x.gale;if(x.risk)risk*=x.risk;}
  if(!d.name||!d.name.trim())w.push('She needs a name.');
  else if((S.retired||[]).some(n=>n.toLowerCase()===d.name.trim().toLowerCase()))w.push('That name has been retired. No line may use it again.');
  else if(S.ships.some(x=>x.name.toLowerCase()===d.name.trim().toLowerCase())||(S.orders||[]).some(o=>o.d.name.toLowerCase()===d.name.trim().toLowerCase()))w.push('You already have a ship of that name.');
  return {berths,cargo,price,months,fuelK,crewK,fs,t,gale,risk,safety:SUBDIV[d.subdiv].safety,decay:Q.decay,warn:w,eng:e,
    parts:{hull:hull*sizeK*B.price*PX(),machinery:power*B.price*PX(),interiors:interiors*B.price*PX(),extras:extras*B.price*PX()}};
}
/* a stand-in ship for forecasts and drawings */
function designShip(d,st){
  st=st||designStats(d);
  return {id:-1,name:(d.name||'Yard No. '+(S.yardNext||534)).trim(),built:Math.floor(yNow()),grt:d.grt,knots:d.knots,berths:st.berths,cargo:st.cargo,fuel:d.fuel,base:st.price,
    up:{reefer:!!d.extras.reefer,wireless:!!d.extras.wireless,boats:!!d.extras.boats},fit:100,captain:null,pay:1,morale:65,cond:95,line:null,speed:1,maint:1,autoDock:50,state:'port',port:'GLA',
    fac:{...(d.fac||{})},cruiser:!!(PURPOSES[d.purpose]&&PURPOSES[d.purpose].cruiser),fuelK:st.fuelK,crewK:st.crewK,appFS:st.fs,appT:st.t,galeK:st.gale,riskK:st.risk,safety:st.safety,decayK:st.decay,style:d.style,novelty:true,design:{form:d.form,funnels:d.funnels,purpose:d.purpose,layout:d.layout},
    len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range};
}
/* the best of the lines you run, or of all routes, for a forecast */
function designForecast(d){
  const st=designStats(d),sh=designShip(d,st);let best=null;
  for(const rk of Object.keys(ROUTES)){if(!routeOpen(rk,S.m))continue;if(!S.lines[rk])S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null],_tmp:1};
    let pm=0;try{pm=econYear(sh,rk).pm;}catch(e){pm=-1e9;}
    if(S.lines[rk]._tmp)delete S.lines[rk];
    if(!best||pm>best.pm)best={rk,pm};}
  let line=null;if(d.line&&ROUTES[d.line]){if(!S.lines[d.line])S.lines[d.line]={fares:defaultFares(d.line),service:1,adv:1,last:[null,null],_tmp:1};
    try{line={rk:d.line,pm:econYear(sh,d.line).pm};}catch(e){}if(S.lines[d.line]._tmp)delete S.lines[d.line];}
  return {st,best,line};
}

/* ---------- builders' slips: other lines' orders keep them busy ---------- */
function slipsOf(b){
  S.bslips=S.bslips||{};const B=b==='own'?ownBuilder():BUILDERS[b];if(!B)return [];
  let L=S.bslips[b];
  // the Line's own slip starts empty (0.35.5)
  if(!L){L=S.bslips[b]=[];for(let i=0;i<B.slips;i++){const R=seed(b.length*97+i*13+7);L.push(b!=='own'&&R()<0.6?{until:S.m+Math.round(3+R()*20),who:'rival'}:{until:S.m,who:null});}}
  return L;
}
/* a save keeps an order's slip as a copy of the builder's slip, so after loading it must point at the builder's own
   again, or a launch frees the copy and the slip stays booked for ever (0.35.5). Slips booked to the Line by no order
   (from saves made before the fix) are freed. */
function relinkSlips(s){const B=s.bslips||{},used=new Set();
  for(const o of s.orders||[]){if(!o.slip)continue;const L=B[o.d.builder]||[];
    let x=o.slipI!==undefined?L[o.slipI]:null;if(!x||used.has(x))x=L.find(q=>q.who==='us'&&!used.has(q))||null;
    if(x){x.who='us';used.add(x);o.slip=x;o.slipI=L.indexOf(x);}else o.slip=null;}
  for(const b in B)for(const x of B[b])if(x.who==='us'&&!used.has(x)){x.who=null;x.until=Math.min(x.until,s.m);}}
function slipFreeAt(b){const L=slipsOf(b);if(!L.length)return S.m;
  const q=(S.orders||[]).filter(o=>o.d.builder===b&&o.stage==='waiting').length;
  const ends=L.map(x=>Math.max(S.m,x.until)).sort((a,c)=>a-c);return ends[Math.min(q,ends.length-1)]+(q>=ends.length?12:0);}
function slipsMonth(){
  for(const b of Object.keys(BUILDERS).concat(S.shore&&S.shore.slip?['own']:[])){const L=slipsOf(b);
    for(const x of L)if(x.who==='rival'&&x.until<=S.m)x.who=null;
    // rivals order ships too, especially in good times
    const free=L.filter(x=>x.who===null&&x.until<=S.m&&!(S.orders||[]).some(o=>o.slip===x));
    // the builder keeps a free slip for each of the Line's orders still in the drawing office or waiting (0.35.6)
    const held=(S.orders||[]).filter(o=>o.d.builder===b&&(o.stage==='drawing'||o.stage==='waiting')).length;
    if(b!=='own'&&free.length>held&&Math.random()<(slump(S.m)>0.5?0.03:0.1)){const x=free[0];x.who='rival';x.until=S.m+14+Math.floor(Math.random()*18);}}
}

/* ---------- orders ---------- */
const STAGES={drawing:'In the drawing office',waiting:'Waiting for a slip',framing:'Keel laid, framing',plating:'Plating the hull',fitting:'Launched, fitting out',trials:'On trials',done:'Delivered'};
/* the German yard takes no British orders from the war until 1921: after the armistice it builds for the Reparations
   Commission (0.35.7) */
const builderShut=k=>k==='elbe'&&newCal()&&S.m>=ym(1914,7)&&S.m<ym(1921,0);
function placeOrder(d){
  if(rescueNoBuy())return {ok:false,why:'Under the rescue terms the Line may order no ship until half the loan is repaid.'};
  if(builderShut(d.builder))return {ok:false,why:'Elbe-Werft takes no British orders until 1921: the German yards are building for the Reparations Commission.'};
  if(warNoBuild())return {ok:false,why:'The yards are working for the Admiralty. No new orders until the war is over.'};
  const st=designStats(d);if(st.warn.length)return {ok:false,why:st.warn[0]};
  const adm=!!(d.adm&&admEligible(d)),dep=Math.round(st.price*0.1),own=adm?Math.round(dep/3):dep;if(S.cash<own)return {ok:false,why:`The yard wants ${fmt(own)} with the order${adm?' (the Admiralty pays the rest)':''}.`};
  S.orders=S.orders||[];S.yardNext=S.yardNext||534;
  const o={id:S.yardNext++,d:Object.assign(JSON.parse(JSON.stringify(d)),{auto:{mach:false,form:false}}),price:st.price,paid:0,due:0,months:st.months,prog:0,stage:'drawing',left:2,ordered:S.m,late:0,unpaid:0,log:[],pi0:PX(),wb:warBuild(S.m),mk0:shipIdx(),adm,admBal:0};
  o.d.name=o.d.name.trim();
  pay(o,dep,'deposit');S.orders.push(o);
  logOrder(o,`Ordered from ${builderOf(o.d).name} as Yard No. ${o.id}. ${fmt(dep)} paid with the order.`);
  news(`The Morven Line orders a new ${PURPOSES[d.purpose].name.toLowerCase()}, SS ${o.d.name}, from ${builderOf(o.d).name}: ${int(d.grt)} tons, ${d.knots} knots, ${fmt(st.price)}.`,'good',true);
  return {ok:true,o};
}
/* a stage payment: on Admiralty terms the Admiralty lends two thirds of it, added to her loan */
function pay(o,amt,what){const own=o.adm?amt/3:amt;S.cash-=own;o.paid+=amt;if(o.adm)o.admBal=(o.admBal||0)+amt-own;S.mtd.capex=(S.mtd.capex||0)+own;}
const currentStyle=()=>{const y=yNow();return y>=1950?'contemp':y>=1933?'moderne':y>=1925?'deco':'edw';};
function logOrder(o,t){o.log.unshift({m:S.m,t});if(o.log.length>12)o.log.length=12;}
/* stage payments: 10% with the order, 20% at the keel, 30% at the launch, the rest on delivery */
function bill(o,share,what){
  // each stage is billed once: an unpaid one goes into the arrears and the work goes on once they are paid (0.39.5: the stage
  // was billed again after the arrears were paid, so a keel could be charged three times)
  o.billed=o.billed||{};if(o.billed[what])return o.due<=0;o.billed[what]=true;
  const amt=Math.round(o.price*share);
  if(S.cash-(o.adm?amt/3:amt)>=-odLimit()*0.5){pay(o,amt,what);logOrder(o,`${fmt(amt)} paid ${what}.`);return true;}
  o.due+=amt;o.unpaid++;logOrder(o,`Could not pay ${fmt(amt)} ${what}. The yard has stopped work.`);
  news(`${builderOf(o.d).name} has stopped work on SS ${o.d.name}: ${fmt(amt)} is owed.`,'bad',true);return false;
}
function ordersMonth(){
  slipsMonth();
  for(const o of (S.orders||[]).slice()){
    const B=builderOf(o.d);if(!B){o.stage='waiting';continue;}
    if(o.due>0){
      if(S.cash-o.due>=-odLimit()*0.5){pay(o,o.due,'arrears');logOrder(o,`Arrears of ${fmt(o.due)} paid. Work resumes.`);o.due=0;o.unpaid=0;}
      else{o.unpaid++;if(o.unpaid>=7){S.orders=S.orders.filter(x=>x!==o);
        news(`${B.name} has cancelled the contract for SS ${o.d.name} after six months unpaid. The ${fmt(o.paid)} paid is lost and the hull will be sold elsewhere.`,'bad',true);}
        continue;}
    }
    if(o.stage==='drawing'){o.left--;if(o.left<=0){o.stage='waiting';logOrder(o,'Drawings approved.');}}
    if(o.stage==='waiting'){if(warNoBuild())continue; // no keel for a merchant ship while the war lasts
      const L=slipsOf(o.d.builder),x=L.find(s=>s.who===null&&s.until<=S.m&&!(S.orders||[]).some(q=>q.slip===s));
      if(x){x.who='us';o.slip=x;o.slipI=L.indexOf(x);if(!bill(o,0.2,'at the keel laying')){x.who=null;o.slip=null;continue;}
        o.stage='framing';o.keel=S.m;logOrder(o,`Keel laid on slip ${L.indexOf(x)+1}.`);news(`The keel of SS ${o.d.name} is laid at ${B.name}.`);}
      continue;}
    if(['framing','plating','fitting'].includes(o.stage)){
      // strikes, steel shortages and a good month on the yard
      // Admiralty work comes first in the war; the moulders' strike of autumn 1919 starves the yards of castings (0.35.6)
      let step=1/o.months*(warNoBuild()?0.25:1)*(moulders()?0.25:1);const R=Math.random();
      if(R<0.03){o.late+=2;step=0;logOrder(o,'A strike in the yard. No work this month.');news(`Riveters at ${B.name} are on strike. SS ${o.d.name} is delayed.`,'bad');}
      else if(R<0.07){step*=0.5;logOrder(o,'Steel deliveries late.');}
      else if(R>0.95){step*=1.4;}
      if(o.d.contract==='cost'&&Math.random()<0.05){const x=Math.round(o.price*(0.02+Math.random()*0.05)/1000)*1000;o.price+=x;logOrder(o,`Costs overrun by ${fmt(x)}.`);news(`Costs are running over on SS ${o.d.name}: another ${fmt(x)} on the cost-plus contract.`,'bad');}
      o.prog=Math.min(1,o.prog+step);
      if(o.stage==='framing'&&o.prog>=0.3){o.stage='plating';logOrder(o,'Framed. Plating begins.');}
      if(o.stage==='plating'&&o.prog>=0.62){
        if(!bill(o,0.3,'at the launch')){o.prog=0.62;continue;}
        o.stage='fitting';o.launched=S.m;if(o.slip){o.slip.who=null;o.slip.until=S.m;o.slip=null;}
        const SP=LAUNCH_SPONSORS.filter(x=>(S.m>=ym(1923,0)||!/Baldwin/.test(x))&&(B.port==='GLA'||!/Provost|Montrose|Eglinton/.test(x))&&(S.m>=ym(1912,0)||!/Princess Mary/.test(x))),sp=SP[Math.floor(Math.random()*SP.length)]; // Scottish sponsors at Scottish yards; Princess Mary launched ships once grown (0.39.3)
        logOrder(o,`Launched by ${sp}.`);news(`SS ${o.d.name} is launched at ${B.name}. ${sp[0].toUpperCase()+sp.slice(1)}${sp.includes(', ')?',':''} names her before a crowd of thousands, and she takes the water cleanly.`,'good',true);}
      if(o.stage==='fitting'&&o.prog>=1){o.stage='trials';o.left=1;logOrder(o,'Fitting out complete. Trials next.');}
      continue;}
    if(o.stage==='trials'){o.left--;if(o.left>0)continue;
      const st=designStats(o.d),q=B.quality,kn=+(o.d.knots*(0.975+Math.random()*0.035+(q-1)*0.3)).toFixed(1);
      o.trial=kn;
      // the bank's mortgage on her is advanced against the last payment, so a Line short of cash can take delivery (0.35.5)
      if(!o.mortAdv&&!(S.noLend>S.m)&&S.cash<o.price*0.5){const adv=Math.min(Math.round(o.price*0.5),Math.max(0,Math.round(headroom()+0.7*o.price)));if(adv>0){S.debt+=adv;S.cash+=adv;o.mortAdv=adv;}}
      if(!bill(o,1-(o.paid+o.due)/o.price,'on delivery'))continue;
      deliver(o,st,kn,B);}
  }
}
const LAUNCH_SPONSORS=['Lady Morven, wife of the chairman','the Duchess of Montrose','the Lord Provost\'s wife','Princess Mary','a shipyard apprentice\'s mother, at the chairman\'s insistence','the Countess of Eglinton','Mrs Stanley Baldwin'];
function deliver(o,st,kn,B){
  const d=o.d,sh=makeShip({name:d.name,built:Math.floor(yNow()),grt:d.grt,knots:kn,berths:{...st.berths},cargo:st.cargo,fuel:d.fuel,base:Math.round(o.price/(o.wb||1)),pi0:o.pi0||1,reefer:!!d.extras.reefer},96,B.port);
  Object.assign(sh,{fuelK:st.fuelK*Math.pow(d.knots/kn,0),crewK:st.crewK,appFS:st.fs,appT:st.t,galeK:st.gale,riskK:st.risk,safety:st.safety,decayK:st.decay,style:d.style,newUntil:S.m+18,foul:0,
    len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range,designLine:d.line||null,
    design:{layout:d.layout||null,form:d.form,funnels:d.funnels,purpose:d.purpose,mach:d.mach,quality:d.quality,yardNo:o.id,builder:B.name,extras:Object.keys(d.extras).filter(k=>d.extras[k])},fit:100});
  sh.acq=S.m;sh.paid=o.price;sh.mk0=o.mk0||null; // her first year she sells for no more than her price, moved with the market (0.35.6)
  sh.up.wireless=!!d.extras.wireless;sh.up.lux=d.quality>=2;sh.fac={...(d.fac||{})};sh.cruiser=!!(PURPOSES[d.purpose]&&PURPOSES[d.purpose].cruiser);
  for(const k of ['stab','fins','aircon','pool','cinema','rphone','radar','hatch','heavy','deep','boats'])if(d.extras[k])sh.up[k]=true;
  if(yearNow()>=1935&&paxBerths(sh)>=60)sh.up.hosp=true; // an isolation hospital is built into every passenger ship from 1935 (0.37.1)
  const pool=(S.capPool||[]).slice().sort((a,b)=>b.exp-a.exp);if(pool.length){sh.captain=pool[0];S.capPool=S.capPool.filter(q=>q!==pool[0]);}
  if(o.adm&&o.admBal>0){sh.adm={bal:o.admBal,bal0:o.admBal,sub:Math.round(o.price*ADM_SUB/12)};o.admBal=0;}
  sh.paint=livFill(lineLiv());sh.acq=S.m;S.ships.push(sh);S.orders=S.orders.filter(x=>x!==o);
  const toLine=d.line&&S.lines[d.line]&&routeOpen(d.line,S.m)?d.line:null;if(toLine)doAction('moveship',[sh.id,toLine]); // she joins the line she was ordered for (0.35.4)
  if(d.builder==='own')S.shore.slipBuilt=(S.shore.slipBuilt||0)+1;
  // the bank takes a mortgage on the new ship as on any other
  // only when the Line needs it, and never while a panic has stopped lending (0.35.4: it was advanced to a Line with millions in hand)
  const mort=o.mortAdv||0; // advanced against the last payment, if the Line needed it
  news(`SS ${d.name} made ${kn} knots on the measured mile and is handed over at ${PN[B.port]}.${sh.adm?` The Admiralty's loan on her stands at ${fmt(Math.round(sh.adm.bal))}, and it pays ${fmt(sh.adm.sub*12)} a year while she sails.`:''}${mort>0?` The bank advances ${fmt(mort)} on her mortgage.`:''} ${sh.captain?sh.captain.name+' takes command.':''} ${toLine?`She joins the ${ROUTES[toLine].name} service.`:'Assign her to a line.'}`,'good',true);
  wire(sh,`SS ${d.name} handed over at ${PN[B.port]}. Trials ${kn} knots. Ready for service.`,'good');
}

/* a second-hand ship built in the last twenty years or so, for the brokers' lists */
const GEN_A=['Ard','Glen','Strath','Loch','Ben','Inver','Kil','Dun','Bal','Craig','Auch','Fin'],GEN_B=['garry','nevis','allan','more','dee','tay','ness','bride','rannoch','shiel','lomond','orchy','carron','spey'];
function genMarketShip(){
  const y=yNow(),pk=['inter','inter','emig','mixed','cargo','cargo','reefer','tourist'][Math.floor(Math.random()*8)];
  const P=PURPOSES[pk];if(!techOn(P.from,y))return genMarketShip();
  const built=Math.max(newCal()?yearOfM(S.m0)-25:1919,Math.floor(y-3-Math.random()*20)),d=defaultDesign(pk);d.auto={mach:false,form:false};
  d.grt=Math.round((P.size[0]+(P.size[1]-P.size[0])*Math.random()*0.45)*shipEraGrt(built)/100)*100; // smaller and slower the older she is
  d.knots=+Math.min(P.speed[1],P.speed[0]+(P.speed[1]-P.speed[0])*Math.random()*0.5+Math.max(0,built-1920)*0.06+shipEraKnots(built)).toFixed(1);
  d.mach=built>=1930&&d.knots>17?'geared':built>=1926&&Math.random()<0.3?'motor':built<1895?'recip':'quad';if(d.mach==='motor')d.knots=Math.min(d.knots,MACHINES.motor.max(built));
  d.fuel=built>=1925||d.mach==='motor'?'oil':'coal';d.style=built>=1950?'contemp':built>=1933?'moderne':built>=1925?'deco':'edw';d.quality=Math.random()<0.2?2:1;
  let name=GEN_A[Math.floor(Math.random()*GEN_A.length)]+GEN_B[Math.floor(Math.random()*GEN_B.length)];name=name[0]+name.slice(1);
  const st=designStats(d);
  return {name,built,grt:d.grt,knots:d.knots,berths:{...st.berths},cargo:st.cargo,fuel:d.fuel,base:Math.round(st.price*0.8/warBuild(S.m)),pi0:PX(),reefer:!!d.extras.reefer,
    note:`A ${PURPOSES[pk].name.toLowerCase()}, ${MACHINES[d.mach].name.toLowerCase()}, ${built<1901&&d.style==='edw'?'Victorian':STYLES[d.style].name} interiors.`,gen:{fuelK:st.fuelK,crewK:st.crewK,appFS:st.fs,style:d.style,design:{form:d.form,funnels:d.funnels,purpose:pk},len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range}};
}
