/* ================= FLOATING THE LINE (0.31, stage R4) =================
   The Line starts private and can never be bid for. Floating sells new shares to the public for capital: a minority
   (up to 49%) brings a board with outside members who set targets and complain but cannot remove the owner, and no
   bid is possible; a majority brings more money, a board that can vote the owner out if its confidence collapses, and
   raiders who can bid for the Line. Buying shares back at the market restores control. Against a bid the Line has
   seven defences: a white knight, a bid for the bidder (Pac-Man), selling the ships (scorched earth), a share buyback,
   founders' voting shares (set up before any bid), a crown jewel sale, and an appeal to the government against a
   foreign bidder. Everything here waits for a float: a private Line plays exactly as before. */
const FL_OPTS=[0.25,0.49,0.6,0.75],FL_FEE=0.05,FL_DISC=0.9;   // the issuing house takes a twentieth; shares are issued a tenth under their value
const FL_FOUNDERS=0.85,FL_VOTES=3;                           // founders' shares: investors pay less, the founder's shares carry three votes
const flOn=()=>!!(S.fl&&S.fl.pub>0);
const flOwn=()=>S.fl?S.fl.own/S.fl.n:1;                      // the owner's share of the Line
const flMajority=()=>flOn()&&flOwn()<0.5;                    // a majority float: removal and bids possible
const flC=()=>S.ex&&S.ex.cos.morven;
/* what the Line is worth to the market: half on its net worth, half on eight years' profit; never below a quarter of the fleet */
function flWorth(){const fv=fleetValue(),fl=0.25*fv+5000*PX(),F=S.fl||{},
    // earnings: the last full year's accounts, not this year's to date scaled up (0.35.5: a good January was multiplied by twelve)
    e=F.lastProfit!==undefined?F.lastProfit:((S.annual||{})[String(YEAR0+Math.floor(S.m/12)-1)]||0);
  return 0.5*Math.max(fl,netWorth())+0.5*Math.max(fl,e*8);}
/* the float itself: new shares for the public, so the money goes to the Line */
function flCanFloat(){if(flOn()||S.over||mkShut())return 'The Stock Exchange is closed.';
  if(S.ships.length<3)return 'A company floats on a fleet: three ships at least.';
  if(S.m-S.m0<36)return 'The City wants three years of accounts first.';
  if(netWorth()<60000*PX())return `Net worth must be at least ${fmt(60000*PX())} for the issuing houses to take it on.`;return '';}
/* the issue (0.35.5): half the shares sold are new and half the owner's own, so the Line after the float is worth what it
   was plus the new money only; the public pays nine tenths of that a share. Before, the share count assumed all the money
   went to the Line, and the shares were issued a third over what they were worth */
function flIssue(pct,founders){const V=flWorth()*mkEnsure().mood*(founders?FL_FOUNDERS:1),n0=V/(2.5*PX()),n=n0/(1-pct/2),pub=Math.round(n*pct),
  p=FL_DISC*V/(n*(1-FL_DISC*pct/2));return {V,n:Math.round(n),pub,p,gross:p*pub};}
function flRaise(pct,founders){return Math.round(flIssue(pct,founders).gross*(1-FL_FEE));}
function flFloat(pct,founders){if(flCanFloat()||!FL_OPTS.includes(pct))return false;const M=mkEnsure();
  const I=flIssue(pct,founders),raised=Math.round(I.gross*(1-FL_FEE)),gross=I.gross,n=I.n,pub=I.pub;
  const toLine=Math.round(raised/2); // half the shares sold are new, for the Line; half are the owner's own, sold for the owner (0.34)
  S.cash+=toLine;S.ownerCash=(S.ownerCash||0)+raised-toLine;S.fl={n,own:n-pub,pub,founders:!!founders,conf:65,floated:S.m,raised:toLine,ownerCash:raised-toLine,pay:'normal',targets:null,knight:null,bid:null,nextBid:S.m+12,seen:{},paid:0};
  M.cos.morven={n,px:gross/pub,sh:1,dy:0,hist:[],since:S.m,f:flWorth(),e:0,w:0};
  flTargets();
  news(`The Morven Line is floated on the Stock Exchange: ${Math.round(pct*100)}% of it sold to the public for ${fmt(raised)} after the issuing house's fee: ${fmt(toLine)} in new capital for the Line, ${fmt(raised-toLine)} to you for shares of your own.${pct>0.5?' The public holds the majority: the board can remove you, and the Line can be bid for.':' You keep the majority.'}`,'good',true);return true;}
/* a share buyback: the Line buys its own shares at the market and cancels them, raising the owner's share */
function flBuyback(pct){const F=S.fl,c=flC();if(!flOn()||mkShut())return false;const q=Math.floor(Math.min(pct*F.n,F.pub));if(q<1)return false;
  const imp=Math.min(0.5,0.6*q/Math.max(1,F.pub)),cost=Math.round(q*c.px*(1+imp/2)*(1+MK_FEE_BUY));if(S.cash<cost)return false;
  S.cash-=cost;F.pub-=q;F.n-=q;c.n=F.n;c.px*=1+imp;c.e=(c.e||0)+Math.log(1+imp);
  news(`The Line buys back ${int(q)} of its shares for ${fmt(cost)}. You now hold ${Math.round(flOwn()*1000)/10}%.`);
  if(F.pub<1){delete S.ex.cos.morven;S.fl=null;news('The last public shares are bought in: the Morven Line is private again.','good');}return true;}
function flFounders(){const F=S.fl;if(F&&(F.founders||F.bid))return false;if(!F)return false;F.founders=true;
  news('The Line creates founders\' voting shares: your shares now carry three votes each. Investors think less of the Line for it, and its shares fall.','');return true;}

/* ---------- the board ---------- */
const confWord=v=>v<20?'in revolt':v<35?'losing patience':v<50?'uneasy':v<70?'content':'delighted';
/* the targets for the year, set each January at the annual meeting */
function flTargets(){const F=S.fl,c=flC(),last=F.lastProfit,I=S.ex.idx[S.ex.idx.length-1];
  // profit: within a tenth of last year, or six per cent on what the Line is worth, whichever is less (seven tenths in a slump);
  // the shares: judged against shipping shares as a whole, so a fall in the whole market is not the owner's fault
  const p=Math.min(last===undefined?0:Math.max(0,last)*0.9,0.06*flWorth())*(slump(S.m)>0.3?0.7:1);
  F.targets={y:Math.floor(yearOfM(S.m)),div:0.03,px0:c.px,idx0:I?I[1]:100,profit:Math.max(0,p),safe:true};}
/* January: last year's profit decides the dividend and is judged against the targets */
function floatJanuary(profit){const F=S.fl;if(!F||!flOn())return;const c=flC();F.lastProfit=profit;
  const pay=Math.max(0,profit)*MK_DIV[F.pay].pay,out=Math.round(pay*F.pub/F.n);
  if(out>0&&!rescueNoDiv()){book('divpaid',-out);F.paid++;}c.dy=rescueNoDiv()?0:pay/F.n; // none while a rescue loan is owed (0.37.0)
  const T=F.targets,res=[];let d=0;
  if(T){const yld=pay/F.n/Math.max(1e-6,c.px);
    const I=S.ex.idx[S.ex.idx.length-1],rel=(c.px/T.px0)/((I?I[1]:100)/T.idx0);
    if(yld>=T.div||profit<=0){d+=yld>=T.div?6:0;res.push(yld>=T.div?'the dividend was paid':'there was no profit to pay from');}else{d-=8;res.push('the dividend fell short');}
    if(profit>=T.profit){d+=6;res.push('profit met its mark');}else{d-=8;res.push('profit fell short');}
    if(rel>=0.9){d+=5;res.push('the shares held up against the market');}else{d-=8;res.push('the shares fell behind the market');}
    if(T.safe){d+=3;}else{d-=12;res.push('ships and lives were lost');}}
  F.conf=clamp(F.conf+d,0,100);
  const maj=flMajority();
  if(typeof mvProxyAgainst==='function'&&mvProxyAgainst())return; // a raider with a stake forces a vote
  const warned=F.lastConf!==undefined&&F.lastConf<35;F.lastConf=F.conf; // the board warns a year before it acts
  if(maj&&F.conf<20&&warned){S.over='removed';S.removed={t:S.t,conf:F.conf,stake:flOwn(),worth:Math.round(F.own*c.px)};UI.speed=0;
    news(`At the annual meeting the shareholders vote the board's resolution: you are removed as managing director of the Morven Line. You keep your ${Math.round(flOwn()*100)}%.`,'bad',true);save();return;}
  news(`The annual meeting: ${res.join(', ')||'a first year'}. The board is ${confWord(F.conf)} (${Math.round(F.conf)}).${maj&&F.conf<35?' Another year like this and it will move to remove you.':''}${!maj&&F.conf<35?' It cannot remove you, but it is saying so in the newspapers.':''}`,F.conf<35?'bad':'',F.conf<35);
  flTargets();}
/* the board reacts to what happens */
function flEvent(k,sh){const F=S.fl;if(!F||!flOn())return;
  if(k==='lost'){F.conf=clamp(F.conf-(sh&&sh.lost&&sh.lost.lost>0?10:5),0,100);if(sh&&sh.lost&&sh.lost.lost>0&&F.targets)F.targets.safe=false;
    news(`The board demands a full report on the loss of SS ${sh?sh.name:'the ship'}. Confidence falls.`,'bad');}
  if(k==='gross'){F.conf=clamp(F.conf-25,0,100);if(F.targets)F.targets.safe=false;}
  if(k==='riband'){F.conf=clamp(F.conf+5,0,100);news('The board congratulates the owner on the Blue Riband.','good');}}

/* ---------- bids for the Line ---------- */
const flBritish=o=>/British/.test((RIVALS[o]||{}).flag||'');
function flBidders(){const V=flWorth();return coLive().filter(o=>!RIVAL_P[o].kind&&mkInfl(o)<2&&coWorth(o)>0.6*V&&S.rivals[o].cash>0.15*V&&(!S.fl.knight||S.fl.knight.o!==o)).sort((a,b)=>coWorth(b)-coWorth(a));}
function flBid(o,prem){const F=S.fl,c=flC();if(!flMajority()||F.bid||!o)return false;
  prem=prem===undefined?0.3+0.25*mrand():prem;const foreign=o==='combine'||!flBritish(o);
  F.bids=(F.bids||0)+1;F.bid={by:o,price:c.px*(1+prem),pre:c.px,due:S.m+3,foreign,fv0:fleetValue(),crown:false,appealed:false};
  c.sh*=1+prem*0.8;
  const who=o==='combine'?`The ${TRUST_NAME}`:RIVALS[o].name;
  news(`${who} bids ${pxTxt(F.bid.price)} a share for the Morven Line, ${Math.round(prem*100)}% over the market, open until ${monthName(F.bid.due)}. If holders of over half the votes accept, the Line is theirs. See Finance, Shares, for your defences.`,'bad',true);return true;}
const flBidName=b=>b.by==='combine'?`the ${TRUST_NAME}`:RIVALS[b.by].name;
function flEndBid(why,good){const F=S.fl,b=F.bid;F.bid=null;F.nextBid=S.m+36;const c=flC();if(c)c.sh=1;news(`The bid by ${flBidName(b)} ${why}`,good?'good':'bad',true);}
function flBidMonth(){const F=S.fl,m=S.m;if(!flOn())return;const b=F.bid;
  if(!b){if(!flMajority()||mkShut()||(newCal()&&atWar(m))||m<F.nextBid)return;
    const c=flC(),cheap=c.px<0.8*flWorth()/F.n;
    // the knight who saved the Line may come back for it
    if(F.knight&&coAlive(F.knight.o)&&mrand()<0.006){flBid(F.knight.o,0.2+0.2*mrand());return;}
    if(F.raider&&coAlive(F.raider.o)&&mrand()<0.015){flBid(F.raider.o,0.25+0.2*mrand());return;} // a raider with a stake comes back with a bid
    if(mrand()<(cheap?0.012:0.003)){const o=flBidders()[0];if(o)flBid(o);}return;}
  // the defences that end a bid
  if(b.by!=='combine'&&!coAlive(b.by))return flEndBid('lapses: the bidder has failed.',true);
  if(b.by!=='combine'&&mkStake(b.by)>=MK_CTRL)return flEndBid('is withdrawn: the Line now controls the bidder.',true);
  if(fleetValue()<0.7*b.fv0)return flEndBid('is withdrawn: with its best ships sold, the Line is no longer worth having.',true);
  if(flOwn()>=0.5)return flEndBid('cannot succeed: you hold the majority again. It is withdrawn.',true);
  if(b.crown&&mrand()<0.6)return flEndBid('is withdrawn: the ship it wanted most is gone.',true);
  if(m<b.due)return;
  // the shareholders decide: the premium, the board's confidence and the mood
  const prem=b.price/b.pre-1,a=clamp(0.25+1.5*(prem-0.2)+(55-F.conf)/80+(mkMood()-1)*0.5,0.05,0.95);
  const kn=(F.knight&&F.knight.o===b.by?F.knight.n:0)+(F.raider&&F.raider.o===b.by?F.raider.n:0),votes=a*F.pub+kn,total=F.n+(F.founders?(FL_VOTES-1)*F.own:0);
  if(votes>0.5*total){S.over='taken';S.taken={by:b.by,t:S.t,price:b.price,worth:Math.round(F.own*b.price),pct:a};UI.speed=0;
    news(`Holders of ${Math.round(a*100)}% of the public's shares accept. The Morven Line passes to ${flBidName(b)}; your ${Math.round(flOwn()*100)}% is bought at the bid, ${fmt(S.taken.worth)}.`,'bad',true);save();return;}
  flEndBid(`fails: only ${Math.round(a*100)}% of the public's shares were offered${F.founders?', and your founders\' shares outvote them':''}.`,true);}
/* white knight: a friendly line outside the Combine buys up to a quarter of the Line from the public at a little over the
   bid, as much as its cash and its bankers allow, and a tenth at least */
const flKnightMoney=o=>{const co=S.rivals[o];return Math.max(0,co.cash-coReserve(o))+Math.max(0,coMaxDebt(o)-co.debt);};
function flKnights(){const b=S.fl&&S.fl.bid;if(!b)return [];return coLive().filter(o=>o!==b.by&&!RIVAL_P[o].kind&&!trustMember(o)&&mkInfl(o)<2&&flKnightMoney(o)>0.1*S.fl.n*b.price*1.05).sort((a,c)=>flKnightMoney(c)-flKnightMoney(a)).slice(0,3);}
function flKnight(o){const F=S.fl,b=F&&F.bid;if(!b||F.knight||!flKnights().includes(o))return false;
  const q=Math.floor(Math.min(0.25*F.n,F.pub,flKnightMoney(o)/(b.price*1.05))),cost=q*b.price*1.05;coPay(o,cost);F.pub-=q;F.knight={o,n:q};
  news(`${RIVALS[o].name} comes in as a white knight, buying ${Math.round(q/F.n*100)}% of the Line at over the bid. Those shares will not be sold to ${flBidName(b)}. You owe ${RIVALS[o].name} for it.`,'good',true);return true;}
/* crown jewel: the ship the bidder wants most is sold to a friendly line */
function flCrown(){const F=S.fl,b=F&&F.bid;if(!b||b.crown)return false;const sh=S.ships.filter(x=>x.state!=='lost'&&x.state!=='req'&&!x.em).sort((a,c)=>shipValue(c)-shipValue(a))[0];
  if(!sh||S.ships.length<2)return false;const price=Math.round(shipValue(sh)*0.85),to=coLive().filter(o=>o!==b.by&&!RIVAL_P[o].kind&&!trustMember(o)&&flKnightMoney(o)>=price).sort((a,c)=>(flBritish(c)?1:0)-(flBritish(a)?1:0))[0];if(!to)return false;
  const rk=sh.line||(Object.keys(S.lines)[0])||'liv';S.cash+=price;coPay(to,price);
  const x=makeRivalShip(to,rk,sh.built);Object.assign(x,{name:sh.name,grt:sh.grt,knots:sh.knots,berths:{...sh.berths},cargo:sh.cargo});S.rships.push(x);newRivalVis(x);RW_CACHE.k=null;
  fleetGone(sh,'sold',`sold to ${RIVALS[to].name} to see off the bid`);
  S.ships=S.ships.filter(y=>y!==sh);if(S.selShip===sh.id)S.selShip=S.ships[0]?S.ships[0].id:null;b.crown=true;
  news(`SS ${sh.name}, the Line's finest ship, is sold to ${RIVALS[to].name} for ${fmt(price)}. It cannot be undone.`,'bad',true);return true;}
/* appeal to the government: only against a foreign bidder. The price: the Line stays British and keeps its ships at the Admiralty's call */
function flAppeal(){const F=S.fl,b=F&&F.bid;if(!b||!b.foreign||b.appealed)return false;b.appealed=true;
  if(mrand()<0.8){F.british=true;flEndBid('is blocked by the government, on national grounds. In return the Line undertakes to stay British and to hold every ship at the Admiralty\'s call.',true);flReserve();}
  else news('The government declines to intervene in the bid.','bad',true);return true;}
function flReserve(){if(!S.fl||!S.fl.british||typeof RESERVE_FROM==='undefined'||S.m<RESERVE_FROM)return;for(const sh of S.ships)if(sh.state!=='lost')sh.reserve=true;}
function floatMonth(){if(!S.fl)return;const F=S.fl;
  if(S.riband&&S.riband.o==='morven'&&!F.seen.riband){F.seen.riband=true;flEvent('riband');}if(!(S.riband&&S.riband.o==='morven'))F.seen.riband=false;
  if(S.gross&&F.seen.gross!==S.gross.t){F.seen.gross=S.gross.t;flEvent('gross');}
  if(!flOn())return;F.conf+=(60-F.conf)*0.02;flReserve();flBidMonth();}

/* ---------- on the Shares view ---------- */
function flHTML(){const F=S.fl,c=flC();
  if(!flOn()){const why=flCanFloat(),fnd=!!UI.flFounders;
    return `<section class="sec"><h2>The Morven Line's own shares</h2><p class="note">The Line is private: yours alone, and nobody can bid for it. Floating sells shares to the public: half of them new, for capital to the Line, half your own, for money to you. Sell a minority and a board with outside members sets you targets and complains, but cannot remove you, and no bid is possible. Sell a majority and you raise more, but the board can vote you out if its confidence collapses, and other lines can bid for the Line. You can buy shares back later.</p>
      ${why?`<p class="warnline">${why}</p>`:`<div class="btns">${FL_OPTS.map(p=>`<button class="btn" data-act="flfloat" data-d='${JSON.stringify([p,fnd?1:0])}' ${S.over?'disabled':''}>${UI.confirm==='fl'+p?'Confirm: float ':'Float '}${Math.round(p*100)}% · ${fmt(Math.round(flRaise(p,fnd)/2))} to the Line</button>`).join('')}</div>
      <label class="check"><input type="checkbox" data-flfounders="1" ${fnd?'checked':''}> With founders' voting shares: your shares carry three votes, so a bid can hardly win; investors pay about ${Math.round((1-FL_FOUNDERS)*100)}% less</label>
      <p class="note">The market is ${moodWord(mkMood())}: ${mkMood()>1.15?'a good time to sell shares':mkMood()<0.85?'a poor time to sell shares':'fair prices'}.</p>`}</section>`;}
  const own=flOwn(),maj=flMajority(),b=F.bid,T=F.targets;
  const kn=F.knight?`<p class="note">${RIVALS[F.knight.o]?RIVALS[F.knight.o].name:'A white knight'} holds ${Math.round(F.knight.n/F.n*100)}%, and may one day want the rest.</p>`:'';
  let bid='';
  if(b){const knights=flKnights(),bn=flBidName(b);
    bid=`<div class="advice bad"><strong>A bid for the Line</strong><span class="note">${bn} offers ${pxTxt(b.price)} a share, ${Math.round((b.price/b.pre-1)*100)}% over the market before the bid, until ${monthName(b.due)}. It wins if holders of over half the votes accept: the higher its premium, the lower the board's confidence and the more cheerful the market, the more will sell.</span>
      <div class="btns">${flBuyBtns(true)}</div>
      ${!F.knight&&knights.length?`<div class="btns">${knights.map(o=>`<button class="btn" data-act="flknight" data-id="${o}">White knight: ${esc(RIVALS[o].name)}</button>`).join('')}</div>`:''}
      <div class="btns">${!b.crown?`<button class="btn danger" data-act="flcrown">${UI.confirm==='flcrown'?'Confirm: sell the finest ship':'Crown jewel: sell the finest ship'}</button>`:''}${b.foreign&&!b.appealed?'<button class="btn" data-act="flappeal">Appeal to the government</button>':''}${b.by!=='combine'&&!trustMember(b.by)?`<button class="btn" data-act="mksel" data-id="${b.by}">Pac-Man: bid for ${esc(RIVALS[b.by].name)}</button>`:''}</div>
      <p class="note">Other defences: sell ships until the fleet is worth under seven tenths of what it was (scorched earth); buy back until you hold the majority; or take control of the bidder itself.${F.founders?' Your founders\' shares carry three votes each.':' Founders\' voting shares must be set up before a bid.'}${b.foreign&&!b.appealed?' An appeal works only against a foreign bidder; the price is staying British with every ship at the Admiralty\'s call.':''}</p></div>`;}
  return `<section class="sec"><h2>The Morven Line's own shares</h2>${bid}
    <div class="row"><strong>${pxTxt(c.px)} a share</strong><span class="num">worth ${fmt(F.n*c.px)} at the market</span></div>${mkSpark(c.hist.slice(-60))}
    <dl class="kv"><dt>Your holding</dt><dd>${Math.round(own*1000)/10}% · ${fmt(F.own*c.px)}</dd><dt>The public</dt><dd>${Math.round(F.pub/F.n*1000)/10}%</dd><dt>Raised at the float</dt><dd>${fmt(F.raised)} for the Line, ${fmt(F.ownerCash||0)} to you (${monthName(F.floated)})</dd>${F.founders?'<dt>Founders\' shares</dt><dd>three votes each</dd>':''}${F.british?'<dt>Pledged</dt><dd>British, ships at the Admiralty\'s call</dd>':''}</dl>
    ${kn}${F.raider?`<p class="badline">${RIVALS[F.raider.o]?RIVALS[F.raider.o].name:'A raider'} holds ${Math.round(F.raider.n/F.n*100)}% from a dawn raid. With the board unhappy it can force a vote at the annual meeting, or bid.</p>`:''}
    <p class="${F.conf<35?'badline':'note'}">The board is ${confWord(F.conf)} (${Math.round(F.conf)} of 100).${maj?' The public holds the majority: below 20 at an annual meeting, after a year under 35, the board removes you.':' You hold the majority: the board cannot remove you.'}</p>
    ${T?`<ul class="note" style="padding-left:18px;margin:0"><li>Targets for ${T.y}: a dividend of at least ${Math.round(T.div*100)}% on the share price;</li><li>${T.profit>0?`a profit of at least ${fmt(T.profit)}`:'to make a profit'};</li><li>the shares no more than a tenth behind shipping shares as a whole (from ${pxTxt(T.px0)});</li><li>no ship lost with lives, and no gross negligence${T.safe?'':' (already missed)'}.</li></ul>`:''}
    <div class="ctl"><span class="lbl">Dividend policy</span><div class="seg" role="group">${Object.keys(MK_DIV).map(v=>`<button data-act="fldiv" data-id="${v}" aria-pressed="${F.pay===v}">${MK_DIV[v].name}</button>`).join('')}</div>
      <p class="note">Paid each January out of last year's profit to the public's shares: ${Math.round(MK_DIV[F.pay].pay*100)}% of it. None at all will anger the board.</p></div>
    ${b?'':`<div class="btns">${flBuyBtns(false)}${!F.founders?`<button class="btn" data-act="flfounders">Create founders' voting shares</button>`:''}</div>`}</section>`;}
function flBuyBtns(inBid){const F=S.fl,c=flC();return [0.01,0.05,0.1].map(p=>{const q=Math.min(p*F.n,F.pub),cost=Math.round(q*c.px*(1+Math.min(0.5,0.6*q/Math.max(1,F.pub))/2)*(1+MK_FEE_BUY));
  return `<button class="btn" data-act="flbuyback" data-id="${p}" ${S.cash<cost||mkShut()||S.over?'disabled':''}>Buy back ${Math.round(p*100)}% · ${fmt(cost)}</button>`;}).join('');}
/* the ending pages */
function flEndHTML(){if(S.over==='removed'){const R=S.removed;return `<h3 id="mt">Voted out</h3><p style="margin:0">The shareholders have removed you as managing director of the Morven Line. The board will run it now. You keep your ${Math.round(R.stake*100)}% of the shares, worth about ${fmt(R.worth)} at the market${S.fl&&S.fl.ownerCash?`, and the ${fmt(S.fl.ownerCash)} you took at the float`:''}.</p>`;}
  const T=S.taken;return `<h3 id="mt">Taken over</h3><p style="margin:0">The Morven Line now belongs to ${T.by==='combine'?`the ${TRUST_NAME}`:RIVALS[T.by].name}. Holders of ${Math.round(T.pct*100)}% of the public's shares accepted its bid of ${pxTxt(T.price)} a share. Your own shares are bought at the bid, for ${fmt(T.worth)}${S.fl&&S.fl.ownerCash?`, on top of the ${fmt(S.fl.ownerCash)} you took at the float`:''}.</p>`;}
