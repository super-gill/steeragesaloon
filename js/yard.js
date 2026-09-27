/* ================= SHIPBUILDING =================
   A new ship is designed in the drawing office, ordered from a builder, waits for a slip, is framed, plated, launched,
   fitted out and run over the measured mile before she is handed over. Prices are staged; the work stops if you cannot pay. */
const PURPOSES={
  express:{name:'Express mail liner',size:[18000,85000],speed:[19,31],mix:{f:40,s:25,t:35,tt:0},pax:0.9,cx:1.25,
    blurb:'Speed and splendour for the richest trades. Ruinously dear, and the pride of a line.'},
  inter:{name:'Intermediate liner',size:[8000,30000],speed:[13,21],mix:{f:26,s:26,t:48,tt:0},pax:0.82,cx:1,
    blurb:'The workhorse: steady speed, big capacity in every class and a fair cargo.'},
  emig:{name:'Emigrant ship',size:[6000,20000],speed:[12,17],mix:{f:4,s:14,t:82,tt:0},pax:0.85,cx:0.9,
    blurb:'Plain, roomy and economical. Built to carry as many steerage passengers as the law allows.'},
  tourist:{name:'Tourist liner',from:1927,size:[10000,35000],speed:[15,23],mix:{f:25,s:0,t:0,tt:75},pax:0.88,cx:1.05,
    blurb:'For the new tourist class: students, teachers and holidaymakers who want comfort without the price of first.'},
  mixed:{name:'Passenger-cargo liner',size:[5000,16000],speed:[12,18],mix:{f:40,s:30,t:30,tt:0},pax:0.42,cx:1,
    blurb:'Half passenger ship, half cargo ship, for the colonial and South American trades.'},
  cargo:{name:'Cargo liner',size:[4000,14000],speed:[10,18],mix:{f:100,s:0,t:0,tt:0},pax:0.05,cx:0.85,
    blurb:'Big holds and a dozen cabins. Earns her keep on freight.'},
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
  turb:{name:'Direct-drive turbines',fuels:['coal','oil'],max:y=>30,eff:1.08,crew:1,cost:1.05,rel:1.05,blurb:'Smooth and powerful at full speed, wasteful when slowed.'},
  geared:{name:'Geared turbines',fuels:['oil','coal'],max:y=>32,eff:0.92,crew:0.95,cost:1.12,rel:1,blurb:'Turbines geared down to slower propellers. The modern choice.'},
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
const BUILDERS={
  clyde:{name:'Clydebank Engineering and Shipbuilding',port:'GLA',price:1,speed:1,quality:1.04,slips:3,max:90000,blurb:'Builders of record-breakers. Dear, and worth it.'},
  mersey:{name:'Birkenhead Iron Works',port:'LIV',price:0.97,speed:1,quality:1,slips:2,max:45000,blurb:'Solid Mersey work for the Liverpool lines.'},
  solent:{name:'Woolston Yard',port:'SOU',price:0.93,speed:1.08,quality:0.97,slips:2,max:30000,blurb:'Quick and keen on price. Smaller slips.'},
  elbe:{name:'Elbe-Werft',port:'HAM',price:0.9,speed:0.95,quality:1.03,slips:3,max:90000,blurb:'Fine German engineering, if you can stomach the newspapers.'},
  liguria:{name:'Cantieri di Sestri',port:'GEN',price:0.85,speed:1.15,quality:0.95,slips:2,max:50000,blurb:'Cheap Italian labour and handsome interiors. Slow.'}
};
const OWN_SLIP_COST=250000;
const techOn=(from,y)=>!from||y>=from;
const yNow=()=>yearNow();

/* the public rooms the architects pencil in for each kind of ship, within what her size allows */
function defaultFac(pk,g,y){
  const want={express:{dineF:2,dineS:1,shows:2,pool:1,garden:1,shops:1},inter:{dineF:1,dineS:1,shows:1,garden:1},emig:{dineT:1,family:1},
    tourist:{dineS:1,shows:1,cinema:1},mixed:{dineF:1},cargo:{},reefer:{}}[pk]||{};
  const f={};let n=0;const cap=2+Math.floor(g/8000);
  for(const k in want){let l=want[k];while(l>0&&!levelOk(k,l,g,y))l--;if(l>0&&n+l<=cap){f[k]=l;n+=l;}}
  return f;
}
/* ---------- the design: everything the drawing office works out from the owner's choices ---------- */
function defaultDesign(pk){
  const P=PURPOSES[pk||'inter'],y=yNow();
  const g=Math.round((P.size[0]*0.65+P.size[1]*0.35)/500)*500,kn=Math.round(P.speed[0]+(P.speed[1]-P.speed[0])*0.35);
  return {purpose:pk||'inter',grt:g,knots:kn,form:y>=1929?'bulb':'cruiser',subdiv:'std',mach:kn>18?'geared':'quad',fuel:'oil',
    mix:{...P.mix},pax:P.pax,quality:1,style:y>=1933?'moderne':y>=1925?'deco':'edw',extras:{wireless:true,reefer:!!P.reefer,hatch:pk==='cargo'||pk==='reefer'},
    fac:defaultFac(pk||'inter',g,y),funnels:g>=30000?3:g>=12000?2:1,builder:'clyde',contract:'fixed',name:'',line:'',auto:{mach:true,form:true}};
}
function builderOf(d){return d.builder==='own'?ownBuilder():BUILDERS[d.builder];}
function ownBuilder(){const p=S.shore&&S.shore.slip;if(!p)return null;
  const exp=S.shore.slipBuilt||0;return {name:`Morven Line yard, ${YARD_PORTS[p]}`,port:p,price:0.8,speed:1.15-Math.min(0.15,exp*0.04),quality:0.95+Math.min(0.08,exp*0.02),slips:1,max:40000,blurb:'Your own slip. Cheaper, and better with every ship you build.'};}
function designStats(d){
  if(d.auto&&(d.auto.mach||d.auto.form)){const r=recommend(d);if(d.auto.mach){d.mach=r.mach;d.fuel=r.fuel;}if(d.auto.form)d.form=r.form;}
  const y=yNow(),P=PURPOSES[d.purpose],M=MACHINES[d.mach],H=HULLFORMS[d.form],Q=QUALITY[d.quality],B=builderOf(d)||BUILDERS.clyde;
  const g=d.grt,kn=d.knots,e=engineer(d),w=e.problems.slice();
  if(g>B.max)w.push(`${B.name} has no slip long enough for ${int(g)} tons (their limit is ${int(B.max)}).`);
  if(!M.fuels.includes(d.fuel))w.push(`${M.name} burn oil only.`);
  // what is left once engines and bunkers are in is shared between passengers and cargo
  const fc=facChange({fac:{},grt:g,facPlan:null},d.fac||{}),facRoom=FAC_KEYS.reduce((a,k)=>a+((FAC[k].levels[(d.fac||{})[k]||0]||{}).room||0),0);
  if(slotsUsed(d.fac)>slotsOf({grt:g}))w.push(`A ship of ${int(g)} tons has room for ${slotsOf({grt:g})} venues; the plan has ${slotsUsed(d.fac)}.`);
  for(const k of FAC_KEYS){const l=(d.fac||{})[k]||0;if(l&&!levelOk(k,l,g,y))w.push(`${FAC[k].levels[l].n} needs a bigger ship${FAC[k].levels[l].from>y?' or a later year':''}.`);}
  const room=Math.max(0,e.usable),paxSpace=Math.max(0,room*d.pax-facRoom),per={f:14*Q.space,s:8*Q.space,t:3.2,tt:5.5*Q.space},berths={};
  const tot=Math.max(1,d.mix.f+d.mix.s+d.mix.t+d.mix.tt);
  for(const c of ['f','s','t','tt'])berths[c]=Math.round(paxSpace*d.mix[c]/tot/per[c]);
  if(berths.tt&&y<1925)w.push('Tourist class does not exist yet.');
  const cargo=Math.round((room*(1-d.pax)*1.45+g*0.1)/10)*10;
  // costs: a longer, finer hull costs more steel per ton; engines cost by the horsepower
  const hull=g*22*H.cost*SUBDIV[d.subdiv].cost*P.cx*Math.pow(e.len/lenForSize(g),0.7);
  const power=e.shp*MACH_DATA[d.mach].pps*M.cost/1.1;
  const interiors=(berths.f*250+berths.s*90+berths.t*20+berths.tt*50)*Q.cost*(d.style==='edw'?1:1.08);
  let extras=fc.cost/PX();for(const k in d.extras)if(d.extras[k]&&EXTRAS[k])extras+=EXTRAS[k].cost(g);
  // the biggest ships cost far more than their tonnage: longer slips, heavier plate, more of everything done once only
  const sizeK=1+0.6*Math.pow(Math.max(0,(g-20000)/40000),1.3);
  const base=(hull*sizeK+power+interiors+extras)*B.price*(d.contract==='fixed'?1.08:1)*PX();
  const price=Math.round(base/1000)*1000;
  const months=Math.round((6+g/1600)*Math.pow(Math.max(1,e.shp/15000),0.12)*[0.95,1,1.08,1.15][d.quality]*B.speed*Math.sqrt(P.cx));
  // running character: coal or oil a day at service speed, set by her engines and her lines
  const fuelK=e.fuelDay/(g/(d.fuel==='coal'?70:95));
  const crewK=M.crew*(d.fuel==='oil'?0.9:1)*clamp(0.8+e.shp/g*0.25,0.8,1.6);
  let fs=Q.appeal*(typeof M.appeal==='function'?M.appeal(y):(M.appeal||1)),t=1,gale=1,risk=1/(B.quality*M.rel*1.02);
  for(const k in d.extras)if(d.extras[k]&&EXTRAS[k]){const x=EXTRAS[k];if(x.fs)fs*=x.fs;if(x.t)t*=x.t;if(x.gale)gale*=x.gale;if(x.risk)risk*=x.risk;}
  if(!d.name||!d.name.trim())w.push('She needs a name.');
  else if(S.ships.some(x=>x.name.toLowerCase()===d.name.trim().toLowerCase())||(S.orders||[]).some(o=>o.d.name.toLowerCase()===d.name.trim().toLowerCase()))w.push('You already have a ship of that name.');
  return {berths,cargo,price,months,fuelK,crewK,fs,t,gale,risk,safety:SUBDIV[d.subdiv].safety,decay:Q.decay,warn:w,eng:e,
    parts:{hull:hull*sizeK*B.price*PX(),machinery:power*B.price*PX(),interiors:interiors*B.price*PX(),extras:extras*B.price*PX()}};
}
/* a stand-in ship for forecasts and drawings */
function designShip(d,st){
  st=st||designStats(d);
  return {id:-1,name:(d.name||'Yard No. '+(S.yardNext||534)).trim(),built:Math.floor(yNow()),grt:d.grt,knots:d.knots,berths:st.berths,cargo:st.cargo,fuel:d.fuel,base:st.price,
    up:{reefer:!!d.extras.reefer,wireless:!!d.extras.wireless},fit:100,captain:null,pay:1,morale:65,cond:95,line:null,speed:1,maint:1,autoDock:50,state:'port',port:'GLA',
    fac:{...(d.fac||{})},fuelK:st.fuelK,crewK:st.crewK,appFS:st.fs,appT:st.t,galeK:st.gale,riskK:st.risk,safety:st.safety,decayK:st.decay,style:d.style,novelty:true,design:{form:d.form,funnels:d.funnels,purpose:d.purpose},
    len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range};
}
/* the best of the lines you run, or of all routes, for a forecast */
function designForecast(d){
  const st=designStats(d),sh=designShip(d,st);let best=null;
  for(const rk of Object.keys(ROUTES)){if(!S.lines[rk])S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null],_tmp:1};
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
  if(!L){L=S.bslips[b]=[];for(let i=0;i<B.slips;i++){const R=seed(b.length*97+i*13+7);L.push(R()<0.6?{until:S.m+Math.round(3+R()*20),who:'rival'}:{until:S.m,who:null});}}
  return L;
}
function slipFreeAt(b){const L=slipsOf(b);if(!L.length)return S.m;
  const q=(S.orders||[]).filter(o=>o.d.builder===b&&o.stage==='waiting').length;
  const ends=L.map(x=>Math.max(S.m,x.until)).sort((a,c)=>a-c);return ends[Math.min(q,ends.length-1)]+(q>=ends.length?12:0);}
function slipsMonth(){
  for(const b of Object.keys(BUILDERS).concat(S.shore&&S.shore.slip?['own']:[])){const L=slipsOf(b);
    for(const x of L)if(x.who==='rival'&&x.until<=S.m)x.who=null;
    // rivals order ships too, especially in good times
    const free=L.filter(x=>x.who===null&&x.until<=S.m&&!(S.orders||[]).some(o=>o.slip===x));
    if(b!=='own'&&free.length&&Math.random()<(slump(S.m)>0.5?0.03:0.1)){const x=free[0];x.who='rival';x.until=S.m+14+Math.floor(Math.random()*18);}}
}

/* ---------- orders ---------- */
const STAGES={drawing:'In the drawing office',waiting:'Waiting for a slip',framing:'Keel laid, framing',plating:'Plating the hull',fitting:'Launched, fitting out',trials:'On trials',done:'Delivered'};
function placeOrder(d){
  const st=designStats(d);if(st.warn.length)return {ok:false,why:st.warn[0]};
  const dep=Math.round(st.price*0.1);if(S.cash<dep)return {ok:false,why:`The yard wants ${fmt(dep)} with the order.`};
  S.orders=S.orders||[];S.yardNext=S.yardNext||534;
  const o={id:S.yardNext++,d:Object.assign(JSON.parse(JSON.stringify(d)),{auto:{mach:false,form:false}}),price:st.price,paid:0,due:0,months:st.months,prog:0,stage:'drawing',left:2,ordered:S.m,late:0,unpaid:0,log:[],pi0:PX()};
  o.d.name=o.d.name.trim();
  pay(o,dep,'deposit');S.orders.push(o);
  logOrder(o,`Ordered from ${builderOf(o.d).name} as Yard No. ${o.id}. ${fmt(dep)} paid with the order.`);
  news(`The Morven Line orders a new ${PURPOSES[d.purpose].name.toLowerCase()}, SS ${o.d.name}, from ${builderOf(o.d).name}: ${int(d.grt)} tons, ${d.knots} knots, ${fmt(st.price)}.`,'good',true);
  return {ok:true,o};
}
function pay(o,amt,what){S.cash-=amt;o.paid+=amt;S.mtd.capex=(S.mtd.capex||0)+amt;}
const currentStyle=()=>{const y=yNow();return y>=1950?'contemp':y>=1933?'moderne':y>=1925?'deco':'edw';};
function logOrder(o,t){o.log.unshift({m:S.m,t});if(o.log.length>12)o.log.length=12;}
/* stage payments: 10% with the order, 20% at the keel, 30% at the launch, the rest on delivery */
function bill(o,share,what){
  const amt=Math.round(o.price*share);
  if(S.cash-amt>=-odLimit()*0.5){pay(o,amt,what);logOrder(o,`${fmt(amt)} paid ${what}.`);return true;}
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
    if(o.stage==='waiting'){
      const L=slipsOf(o.d.builder),x=L.find(s=>s.who===null&&s.until<=S.m&&!(S.orders||[]).some(q=>q.slip===s));
      if(x){x.who='us';o.slip=x;if(!bill(o,0.2,'at the keel laying')){x.who=null;o.slip=null;continue;}
        o.stage='framing';o.keel=S.m;logOrder(o,`Keel laid on slip ${L.indexOf(x)+1}.`);news(`The keel of SS ${o.d.name} is laid at ${B.name}.`);}
      continue;}
    if(['framing','plating','fitting'].includes(o.stage)){
      // strikes, steel shortages and a good month on the yard
      let step=1/o.months;const R=Math.random();
      if(R<0.03){o.late+=2;step=0;logOrder(o,'A strike in the yard. No work this month.');news(`Riveters at ${B.name} are on strike. SS ${o.d.name} is delayed.`,'bad');}
      else if(R<0.07){step*=0.5;logOrder(o,'Steel deliveries late.');}
      else if(R>0.95){step*=1.4;}
      if(o.d.contract==='cost'&&Math.random()<0.05){const x=Math.round(o.price*(0.02+Math.random()*0.05)/1000)*1000;o.price+=x;logOrder(o,`Costs overrun by ${fmt(x)}.`);news(`Costs are running over on SS ${o.d.name}: another ${fmt(x)} on the cost-plus contract.`,'bad');}
      o.prog=Math.min(1,o.prog+step);
      if(o.stage==='framing'&&o.prog>=0.3){o.stage='plating';logOrder(o,'Framed. Plating begins.');}
      if(o.stage==='plating'&&o.prog>=0.62){
        if(!bill(o,0.3,'at the launch')){o.prog=0.62;continue;}
        o.stage='fitting';o.launched=S.m;if(o.slip){o.slip.who=null;o.slip.until=S.m;o.slip=null;}
        const sp=LAUNCH_SPONSORS[Math.floor(Math.random()*LAUNCH_SPONSORS.length)];
        logOrder(o,`Launched by ${sp}.`);news(`SS ${o.d.name} is launched at ${B.name}. ${sp} names her before a crowd of thousands, and she takes the water cleanly.`,'good',true);}
      if(o.stage==='fitting'&&o.prog>=1){o.stage='trials';o.left=1;logOrder(o,'Fitting out complete. Trials next.');}
      continue;}
    if(o.stage==='trials'){o.left--;if(o.left>0)continue;
      const st=designStats(o.d),q=B.quality,kn=+(o.d.knots*(0.975+Math.random()*0.035+(q-1)*0.3)).toFixed(1);
      o.trial=kn;
      if(!bill(o,1-(o.paid+o.due)/o.price,'on delivery'))continue;
      deliver(o,st,kn,B);}
  }
}
const LAUNCH_SPONSORS=['Lady Morven, wife of the chairman','the Duchess of Montrose','the Lord Provost\'s wife','Princess Mary','a shipyard apprentice\'s mother, at the chairman\'s insistence','the Countess of Eglinton','Mrs Stanley Baldwin'];
function deliver(o,st,kn,B){
  const d=o.d,sh=makeShip({name:d.name,built:Math.floor(yNow()),grt:d.grt,knots:kn,berths:{...st.berths},cargo:st.cargo,fuel:d.fuel,base:o.price,pi0:o.pi0||1,reefer:!!d.extras.reefer},96,B.port);
  Object.assign(sh,{fuelK:st.fuelK*Math.pow(d.knots/kn,0),crewK:st.crewK,appFS:st.fs,appT:st.t,galeK:st.gale,riskK:st.risk,safety:st.safety,decayK:st.decay,style:d.style,newUntil:S.m+18,foul:0,
    len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range,designLine:d.line||null,
    design:{form:d.form,funnels:d.funnels,purpose:d.purpose,mach:d.mach,quality:d.quality,yardNo:o.id,builder:B.name,extras:Object.keys(d.extras).filter(k=>d.extras[k])},fit:100});
  sh.up.wireless=!!d.extras.wireless;sh.up.lux=d.quality>=2;sh.fac={...(d.fac||{})};
  for(const k of ['stab','fins','aircon','pool','cinema','rphone','radar','hatch','heavy','deep'])if(d.extras[k])sh.up[k]=true;
  const pool=(S.capPool||[]).slice().sort((a,b)=>b.exp-a.exp);if(pool.length){sh.captain=pool[0];S.capPool=S.capPool.filter(q=>q!==pool[0]);}
  sh.acq=S.m;S.ships.push(sh);S.orders=S.orders.filter(x=>x!==o);
  if(d.builder==='own')S.shore.slipBuilt=(S.shore.slipBuilt||0)+1;
  // the bank takes a mortgage on the new ship as on any other
  const mort=Math.min(Math.round(o.price*0.5),Math.max(0,Math.round(headroom())));if(mort>0){S.debt+=mort;S.cash+=mort;}
  news(`SS ${d.name} made ${kn} knots on the measured mile and is handed over at ${PN[B.port]}.${mort>0?` The bank advances ${fmt(mort)} on her mortgage.`:''} ${sh.captain?sh.captain.name+' takes command.':''} Assign her to a line.`,'good',true);
  wire(sh,`SS ${d.name} handed over at ${PN[B.port]}. Trials ${kn} knots. Ready for service.`,'good');
}

/* a second-hand ship built in the years since 1921, for the brokers' lists */
const GEN_A=['Ard','Glen','Strath','Loch','Ben','Inver','Kil','Dun','Bal','Craig','Auch','Fin'],GEN_B=['garry','nevis','allan','more','dee','tay','ness','bride','rannoch','shiel','lomond','orchy','carron','spey'];
function genMarketShip(){
  const y=yNow(),pk=['inter','inter','emig','mixed','cargo','cargo','reefer','tourist'][Math.floor(Math.random()*8)];
  const P=PURPOSES[pk];if(!techOn(P.from,y))return genMarketShip();
  const built=Math.max(1919,Math.floor(y-3-Math.random()*20)),d=defaultDesign(pk);d.auto={mach:false,form:false};
  d.grt=Math.round((P.size[0]+(P.size[1]-P.size[0])*Math.random()*0.45)/100)*100;
  d.knots=+Math.min(P.speed[1],P.speed[0]+(P.speed[1]-P.speed[0])*Math.random()*0.5+Math.max(0,built-1920)*0.06).toFixed(1);
  d.mach=built>=1930&&d.knots>17?'geared':built>=1926&&Math.random()<0.3?'motor':'quad';if(d.mach==='motor')d.knots=Math.min(d.knots,MACHINES.motor.max(built));
  d.fuel=built>=1925||d.mach==='motor'?'oil':'coal';d.style=built>=1950?'contemp':built>=1933?'moderne':built>=1925?'deco':'edw';d.quality=Math.random()<0.2?2:1;
  let name=GEN_A[Math.floor(Math.random()*GEN_A.length)]+GEN_B[Math.floor(Math.random()*GEN_B.length)];name=name[0]+name.slice(1);
  const st=designStats(d);
  return {name,built,grt:d.grt,knots:d.knots,berths:{...st.berths},cargo:st.cargo,fuel:d.fuel,base:Math.round(st.price*0.8),pi0:PX(),reefer:!!d.extras.reefer,
    note:`A ${PURPOSES[pk].name.toLowerCase()}, ${MACHINES[d.mach].name.toLowerCase()}, ${STYLES[d.style].name} interiors.`,gen:{fuelK:st.fuelK,crewK:st.crewK,appFS:st.fs,style:d.style,design:{form:d.form,funnels:d.funnels,purpose:pk},len:st.eng.len,beam:st.eng.beam,draught:st.eng.draught,shp:st.eng.shp,range:st.eng.range}};
}
