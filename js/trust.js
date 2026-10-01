/* ================= THE COMBINE AND THE RATE WARS OF THE EARLY YEARS ================= */
/* Before 1908 there is no North Atlantic conference. The lines fight over every trade: a war between two of them can
   halve steerage fares for months, until they patch up a pool. In October 1902 American money forms the International
   Ocean Combine, a holding company over Imperial Atlantic and Columbia (they keep their names), built on borrowed money.
   It buys more lines when it can, makes the Morven Line offers to buy it out, and answers a refusal with a rate war on
   the Line's trades. It can never force a sale. Games begun in January 1921 (before 0.22) have none of this. */
const TRUST_NAME='International Ocean Combine',TRUST_SHORT='the Combine',TRUST_FROM=ym(1902,9);
const CONF_FROM=ym(1908,0); // the North Atlantic conference forms in 1908; before it there is none to join
const confOpen=()=>!newCal()||S.m>=CONF_FROM;
/* end a sentence on a name that may already end in a full stop (Co.) */
const dotEnd=t=>t.endsWith('.')?t:t+'.';
const trustMember=o=>!!(S.trust&&S.trust.members.includes(o)&&coAlive(o));
const trustMembers=()=>S.trust?S.trust.members.filter(coAlive):[];

/* ---------- wars between the lines ---------- */
/* a line-against-line war on a passenger trade: frequent before the conference, rare after it */
function lineWarsMonth(){
  if(!newCal()||atWar())return;
  const m=S.m,R=Math.random;
  // the great New York rate war of 1904, between the British and Continental lines
  if(m===ym(1904,1))for(const rk of ['liv','gny','ham','nap','exp'])if(!S.wars[rk]){const o=ownersOn(rk),by=Object.keys(o).sort((a,b)=>o[b]-o[a]).slice(0,2);
    S.wars[rk]={left:9,mult:0.85,multT:0.5,by,lines:true,quiet:true};} // the headlines tell this one
  const p=m<CONF_FROM?0.012:0.001;
  for(const rk in ROUTES){const r=ROUTES[rk];if(S.wars[rk]||r.cruise||r.group==='Trades'&&rk!=='rpl'||!routeOpen(rk,m))continue;
    const o=ownersOn(rk),ks=Object.keys(o).filter(k=>coAlive(k));if(ks.length<2||R()>p*(1+0.5*slump(m)))continue;
    // two lines that are not both in the Combine fall out over the trade
    const pair=ks.sort((a,b)=>o[b]*RIVAL_P[b].aggr-o[a]*RIVAL_P[a].aggr);let a=pair[0],b=pair.find(k=>k!==a&&!(trustMember(a)&&trustMember(k)));if(!b)continue;
    S.wars[rk]={left:3+Math.floor(R()*6),mult:0.85,multT:0.55,by:[a,b],lines:true};
    const mine=!!S.lines[rk];
    news(`${RIVALS[a].name} and ${RIVALS[b].name} fall out on ${r.name}. Steerage is being sold at nearly half the usual fare while they fight${mine?': your ships will struggle to fill unless you cut too':''}.`,mine?'bad':'',mine);}
}
/* how a war ends: lines fighting each other agree a pool; a war on the Morven Line burns out */
function warEndText(rk,w){return w.lines?`The lines on ${ROUTES[rk].name} agree a pool and share the trade. Fares recover.`
  :w.trust?`${TRUST_SHORT[0].toUpperCase()+TRUST_SHORT.slice(1)} calls off its rate war on ${ROUTES[rk].name}. Fares recover.`:`The rate war on ${ROUTES[rk].name} has burned out. Fares recover.`;}

/* ---------- the Combine ---------- */
function trustMonth(){
  if(!newCal())return;
  const m=S.m,R=Math.random;
  if(!S.trust&&m>=TRUST_FROM){
    const pick=['imperial','columbia'].filter(coAlive);
    for(const o of coLive().filter(o=>!pick.includes(o)&&!RIVAL_P[o].kind).sort((a,b)=>coWorth(b)-coWorth(a)))if(pick.length<2)pick.push(o);
    S.trust={formed:m,members:pick,bought:[],next:m+12,offers:0};
    // bought with borrowed money: each member is loaded with the Combine's bonds and handed the cash to expand
    for(const o of pick){const k=Math.round(400000*PX()/1000)*1000;S.rivals[o].debt+=k;S.rivals[o].cash+=k;}
    news(`American bankers form the ${TRUST_NAME}, a holding company over ${dotEnd(pick.map(o=>RIVALS[o].name).join(' and '))} The lines keep their names; ${TRUST_SHORT} sets their policy, and it is buying more.`,'bad',true);
    return;}
  if(!S.trust||atWar())return;
  const T=S.trust,members=trustMembers();if(!members.length)return;
  // buying lines: a weak independent now and then, while the Combine's members can pay; it stops growing after 1907
  if(m<ym(1908,0)&&members.length<5&&R()<0.03){
    const payer=members.slice().sort((a,b)=>S.rivals[b].cash-S.rivals[a].cash)[0],pc=S.rivals[payer];
    const t=coLive().filter(o=>!trustMember(o)&&!RIVAL_P[o].kind&&o!=='aurore').sort((a,b)=>coWorth(a)-coWorth(b))[0];
    if(t){const price=Math.max(100000*PX(),coWorth(t)*1.25);
      if(pc.cash+Math.max(0,coMaxDebt(payer)-pc.debt)>=price){coPay(payer,price);T.members.push(t);T.bought.push({o:t,m});
        news(`${TRUST_SHORT[0].toUpperCase()+TRUST_SHORT.slice(1)} buys ${RIVALS[t].name} for about ${fmt(Math.round(price/1000)*1000)}. It keeps its name and ships.`,S.ships.some(x=>x.line&&ownersOn(x.line)[t])?'bad':'');}}}
  // an offer for the Morven Line, once it is worth having: about once in three years, never within two of a refusal
  if(!S.trustOffer&&!S.over&&S.ships.length>=3&&m>=T.next&&R()<0.03){
    if(typeof flMajority==='function'&&flMajority()){T.next=m+36;if(!S.fl.bid&&m<ym(1914,0))flBid('combine');} // a Line the public holds is bid for, not asked (until the war)
    else{const amt=Math.round(Math.max(netWorth(),fleetValue()*0.5)*(1.3+R()*0.3)/1000)*1000;
    if(amt>0){S.trustOffer={amt,exp:m+2};T.offers++;
      news(`${TRUST_SHORT[0].toUpperCase()+TRUST_SHORT.slice(1)} offers ${fmt(amt)} for the Morven Line. It is under Needs attention.`,'',true);}}}
  if(S.trustOffer&&m>=S.trustOffer.exp)trustRefuse(true);
}
/* the owner sells: the game ends with the Line in the Combine */
function trustAccept(){if(!S.trustOffer)return;S.soldFor=S.trustOffer.amt;S.trustOffer=null;S.over='sold';UI.speed=0;
  news(`The Morven Line is sold to the ${TRUST_NAME} for ${fmt(S.soldFor)}.`,'hist');save();}
/* the owner refuses (or lets the offer lapse): a rate war on the Line's busiest trades */
function trustRefuse(lapsed){
  if(!S.trustOffer)return;S.trustOffer=null;const T=S.trust;T.next=S.m+24;
  const n={};for(const x of S.ships)if(x.line&&!isCruise(x.line)&&ACTIVE.includes(x.state))n[x.line]=(n[x.line]||0)+1;
  const rks=Object.keys(n).sort((a,b)=>n[b]-n[a]).slice(0,2);
  for(const rk of rks)if(!S.conf)S.wars[rk]={left:6+Math.floor(Math.random()*5),mult:0.75,multT:0.6,trust:true,by:trustMembers()};
  if(S.conf)news(`${lapsed?'The Line lets the offer lapse. ':''}${TRUST_SHORT[0].toUpperCase()+TRUST_SHORT.slice(1)} is displeased, but the conference shields its members: there is no rate war.`,'',true);
  else news(`${lapsed?'The Line lets the offer lapse. ':''}${TRUST_SHORT[0].toUpperCase()+TRUST_SHORT.slice(1)} answers with a rate war${rks.length?` on ${rks.map(rk=>ROUTES[rk].name).join(' and ')}`:''}: its lines will carry at a loss to break you.`,'bad',true);
}
/* the Combine on the Company tab */
function trustHTML(){
  if(!S.trust)return newCal()&&S.m<TRUST_FROM?'':'';
  const ms=trustMembers(),grt=ms.reduce((a,o)=>a+coFleet(o).reduce((b,x)=>b+x.grt,0),0),ships=ms.reduce((a,o)=>a+coFleet(o).length,0),worth=ms.reduce((a,o)=>a+coWorth(o),0),debt=ms.reduce((a,o)=>a+S.rivals[o].debt,0);
  return `<div class="card trustcard" data-key="trust"><div class="row"><strong>${TRUST_NAME}</strong><span class="chip bad">Holding company</span></div>
    <div class="meta">Formed ${monthName(S.trust.formed)} with American money. ${ships} ships, ${int(grt)} tons, net worth about ${fmt(Math.round(worth/1000)*1000)}, owing ${fmt(Math.round(debt/1000)*1000)}.</div>
    <div class="meta">Members: ${ms.map(o=>`<span class="rdot" style="background:${RIVAL_P[o].col}"></span>${RIVALS[o].name}`).join(', ')}. They keep their names and ships; the Combine sets their fares and does not let them fight each other.</div>
    <div class="meta">${S.trustOffer?`It has offered ${fmt(S.trustOffer.amt)} for the Morven Line.`:S.trust.offers?`It has made the Line ${S.trust.offers} offer${S.trust.offers>1?'s':''}. It answers a refusal with a rate war.`:'It buys lines it can get. It may make the Morven Line an offer once the Line is worth having.'}</div></div>`;
}
