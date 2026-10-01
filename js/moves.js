/* ================= ADVANCED MOVES (0.32, stage R5) =================
   The market's rough end, for the Line and against it. The Line can make a dawn raid (a big stake in one day, at a
   premium, before the price reacts), a tender offer (a set price for every holder, if enough accept), a proxy fight
   (win the shareholders' votes and take the board without a majority), sell short (borrowed shares, bought back later,
   with a fee, a margin and the risk of a squeeze), and a bear raid (short a rival, then start a rate war on its trade).
   A target defends itself: a friendly line takes a blocking stake (a white knight), it sells its best ships (scorched
   earth), or, when the Line's majority is in public hands, it bids for the Line (Pac-Man). Against a floated Line the
   rivals make the same moves: a dawn raid on its shares, a proxy fight at the annual meeting, and a bear raid.
   None of it is riskless: every move costs a premium, a fee or a fight, and the market answers. */
const MV_RAID=0.2,MV_RAID_PREM=0.1,MV_SHORT_FEE=0.04,MV_SHORT_MARGIN=0.5,MV_PROXY_MIN=0.1;
const mvC=id=>S.ex.cos[id];
/* ---------- the Line's moves ---------- */
/* dawn raid: up to a fifth of the company, in a day, at a tenth over the market; the price jumps after */
function mvRaidQty(o){const c=mvC(o);return Math.floor(Math.min(MV_RAID*c.n,mkFree(o)));}
const mvRaidCost=o=>Math.round(mvRaidQty(o)*mvC(o).px*(1+MV_RAID_PREM)*(1+MK_FEE_BUY));
function mvRaid(o){const M=mkEnsure(),c=mvC(o);if(rescueFriend(o)||!c||c.gone||!mkRival(o)||mkShut()||mkStake(o)>=MK_CTRL||(M.me.short&&M.me.short[o]))return false;
  const q=mvRaidQty(o),cost=mvRaidCost(o);if(q<1||S.cash<cost)return false;const before=mkStake(o);
  S.cash-=cost;const h=M.me.pos[o]||(M.me.pos[o]={n:0,cost:0});h.n+=q;h.cost+=cost;c.sh*=1.12;mkOwnPush(o,0,1.12);
  news(`Dawn raid: before the market opens the Line's brokers buy ${Math.round(q/c.n*100)}% of ${mkName(o)} for ${fmt(cost)}. The City wakes to a bid battle.`,'good',true);
  mkThresholds(o,before);mvDefend(o,'raid');return true;}
/* tender offer: a set price for all its shares, open a month, going through only if the Line ends with over half */
function mvTender(o,prem){const M=mkEnsure(),c=mvC(o);if(rescueFriend(o)||!c||c.gone||!mkRival(o)||mkShut()||M.tender||mkStake(o)>=0.9||trustMember(o)||(M.me.short&&M.me.short[o]))return false;
  const price=c.px*(1+prem),need=Math.max(0,0.5*c.n-((M.me.pos[o]||{}).n||0))*price*(1+MK_FEE_BUY);if(S.cash<need)return false;
  M.tender={o,prem,price,pre:c.px,due:S.m+1};c.sh*=1+prem*0.7;mkOwnPush(o,0,1+prem*0.7);
  news(`The Morven Line offers ${pxTxt(price)} a share for every share in ${mkName(o)}, ${Math.round(prem*100)}% over the market, if it ends with over half. The offer closes in ${monthName(S.m+1)}.`,'',true);
  mvDefend(o,'tender');return true;}
function mvTenderClose(){const M=S.ex,T=M.tender;if(!T||S.m<T.due)return;M.tender=null;const o=T.o,c=mvC(o);
  if(!c||c.gone){news(`The offer for ${mkName(o)} lapses.`);return;}
  const free=mkFree(o),own=(M.me.pos[o]||{}).n||0,co=S.rivals[o];
  const a=clamp(0.2+1.8*(T.prem-0.1)+(1-mkMood())*0.3+(coHealth(o)[0]==='In trouble'?0.15:0)-(c.block?0.1:0),0.02,0.95),q=Math.floor(a*free);
  const cost=Math.round(q*T.price*(1+MK_FEE_BUY));c.sh=1;
  if(own+q>0.5*c.n&&S.cash>=cost){const before=mkStake(o),h=M.me.pos[o]||(M.me.pos[o]={n:0,cost:0});h.n+=q;h.cost+=cost;S.cash-=cost;
    news(`The offer for ${mkName(o)} succeeds: holders of ${Math.round(a*100)}% of the shares on the market accept, for ${fmt(cost)}. The Line holds ${Math.round(mkStake(o)*100)}%.`,'good',true);mkThresholds(o,before);}
  else{const fee=Math.round(0.005*c.n*T.price);book('shares',-fee);S.rep=clamp(S.rep-1,0,100);
    news(`The offer for ${mkName(o)} fails: only ${Math.round(a*100)}% of the shares on the market were offered${own+q>0.5*c.n?', and the Line could not pay for them':''}. The advisers' bill is ${fmt(fee)}, and the City notices.`,'bad',true);}}
/* proxy fight: a tenth of the shares and the Line's name, against the board's record */
const mvProxyCost=o=>Math.round(2000*PX()+0.01*mkCap(o));
function mvProxyChance(o){const k=mkStake(o),co=S.rivals[o];
  // shareholders back a board that pays its way; a failing one they will throw out (0.34: a gamble against a well-run line)
  const bad=coProfit(o)<0,trouble=coHealth(o)[0]==='In trouble'||coHealth(o)[0]==='Stretched';
  return clamp(0.05+1.2*k+(S.rep-30)/100+(bad?0.25:0)+(trouble?0.15:0)-(!bad&&!trouble?0.1:0)-(trustMember(o)?1:0),0.02,0.9);}
function mvProxy(o){const M=mkEnsure(),c=mvC(o);if(rescueFriend(o)||!c||c.gone||!mkRival(o)||mkStake(o)<MV_PROXY_MIN||mkInfl(o)>=2||(M.proxyNext&&M.proxyNext[o]>S.m))return false;
  const cost=mvProxyCost(o);if(S.cash<cost)return false;book('shares',-cost);const p=mvProxyChance(o);
  if(mrand()<p){c.proxy=true;const co=S.rivals[o];co.aggr0=co.aggr0||RIVAL_P[o].aggr;
    news(`The Line wins the proxy fight at ${mkName(o)}'s meeting: the shareholders vote your nominees onto its board. You control it with ${Math.round(mkStake(o)*100)}%.`,'good',true);}
  else{S.rep=clamp(S.rep-3,0,100);(M.proxyNext=M.proxyNext||{})[o]=S.m+24;
    news(`The Line loses the proxy fight at ${mkName(o)}. The shareholders back the board, the campaign has cost ${fmt(cost)}, and the Line's standing suffers.`,'bad',true);}return true;}
/* short selling: borrowed shares sold now, bought back later; half the sale put up as margin, a fee to the lender */
function mvShort(id,pct){const M=mkEnsure(),c=mvC(id);if(!c||c.gone||id==='morven'||mkShut()||(M.me.pos[id]&&M.me.pos[id].n>0))return false;const s0=(M.me.short=M.me.short||{})[id];
  // (sell what you hold before selling short)
  const q=Math.floor(Math.min(pct*c.n,0.5*mkFree(id)-(s0?s0.n:0)));if(q<Math.max(1,0.01*c.n))return false; // a short is at least 1% of the company (0.35.6)
  const imp=Math.min(0.5,0.6*q/mkDepth(id)),gross=q*c.px*(1-imp/2),col=gross*(1-MK_FEE_SELL),margin=Math.round(gross*MV_SHORT_MARGIN);if(S.cash<margin)return false;
  S.cash-=margin;c.px*=1-imp;c.e=(c.e||0)+Math.log(1-imp);mkOwnPush(id,Math.log(1-imp));const s=M.me.short[id]||(M.me.short[id]={n:0,col:0,margin:0});s.n+=q;s.col+=col;s.margin+=margin;
  news(`The Line sells short ${int(q)} borrowed shares in ${mkName(id)} for ${fmt(col)}, putting up ${fmt(margin)} as margin. It pays ${Math.round(MV_SHORT_FEE*100)}% a year to borrow them.`);return true;}
const mvShortVal=s=>s.col+s.margin;
function mvCover(id,forced){const M=S.ex,s=M.me.short&&M.me.short[id],c=mvC(id);if(!s)return false;if(mkShut()&&!forced)return false;
  const imp=c&&!c.gone?Math.min(0.5,0.6*s.n/mkDepth(id)):0,cost=c&&!c.gone?s.n*c.px*(1+imp/2)*(1+MK_FEE_BUY):0;if(c&&!c.gone){c.px*=1+imp;c.e=(c.e||0)+Math.log(1+imp);mkOwnPush(id,Math.log(1+imp));}
  S.cash+=s.margin;book('shares',s.col-cost);delete M.me.short[id];
  news(`${forced?'The broker buys in':'The Line buys back'} its short in ${mkName(id)} for ${fmt(cost)}: ${s.col>=cost?'a gain of '+fmt(s.col-cost):'a loss of '+fmt(cost-s.col)}.`,s.col>=cost?'good':'bad',!!forced);return true;}
const mvShortsVal=()=>{const M=S.ex;if(!M||!M.me.short)return 0;let v=0;for(const id in M.me.short){const s=M.me.short[id],c=mvC(id);v+=mvShortVal(s)-(c&&!c.gone?s.n*mkFair(id):0);}return v;};
/* each month: the lender's fee, a squeeze on a big short, and the broker's buy-in when the margin runs out */
function mvShortMonth(){const M=S.ex;if(!M.me.short)return;
  for(const id of Object.keys(M.me.short)){const s=M.me.short[id],c=mvC(id);
    if(!c||c.gone){S.cash+=s.margin;book('shares',s.col);delete M.me.short[id];news(`${mkName(id)} is struck off: the Line's short in it is closed with a gain of ${fmt(s.col)}.`,'good');continue;}
    book('shares',-s.n*c.px*MV_SHORT_FEE/12);
    if(s.n>0.05*(mkFree(id)+s.n)&&!mkShut()&&mrand()<0.06){c.sh*=1.3;news(`The dealers squeeze the shorts in ${mkName(id)}: its shares jump.`,'bad',true);}
    if(!mkShut()&&s.n*c.px*1.01>0.9*mvShortVal(s))mvCover(id,true);}}
function mvShortDiv(id,d){const M=S.ex,s=M.me.short&&M.me.short[id];if(s&&d>0)book('shares',-s.n*d);} // a short seller pays the dividends on what he has borrowed
/* bear raid: a rate war on a trade where the target sails and the Line runs a line; the Line's own fares go down too */
function mvBearRoutes(o){return Object.keys(S.lines).filter(rk=>!S.wars[rk]&&routeOpen(rk,S.m)&&!isCruise(rk)&&coFleet(o).some(x=>x.route===rk));}
// a bear raid needs a real short open, of at least 2% of the company (0.35.5; the size, and none in wartime, 0.35.6)
const mvBearShort=o=>{const s=S.ex.me.short&&S.ex.me.short[o],c=mvC(o);return !!(s&&c&&s.n>=0.019*c.n);};
function mvBear(o,rk){if(rescueFriend(o)||!mkRival(o)||atWar(S.m)||!mvBearRoutes(o).includes(rk)||!mvBearShort(o))return false;const L=S.lines[rk];
  for(const k of ['f','s','t','tt'])if(L.fares[k])L.fares[k]=Math.max(1,Math.round(L.fares[k]*0.75));
  S.wars[rk]={left:6,mult:0.72,multT:0.6,by:[o],bear:true};S.tension[rk]=0;mkShock(o,0.93);
  news(`The Morven Line cuts its fares on ${ROUTES[rk].name} by a quarter and starts a rate war with ${mkName(o)}.`,'',true);
  if(S.conf){const fine=Math.round(2000*PX());book('legal',-fine);S.rep=clamp(S.rep-2,0,100);news(`The conference fines the Line ${fmt(fine)} for starting a rate war among its members.`,'bad');}
  // it fights back: a war of its own on another of the Line's trades
  if(mrand()<0.5){const alt=Object.keys(S.lines).filter(k=>k!==rk&&!S.wars[k]&&!isCruise(k)&&coFleet(o).some(x=>x.route===k))[0];
    if(alt){S.wars[alt]={left:5,mult:0.72,multT:0.6,by:[o]};news(`${mkName(o)} answers with a rate war on ${ROUTES[alt].name}.`,'bad',true);}}
  return true;}
/* a target's answer to a raid or an offer */
function mvDefend(o,kind){const M=S.ex,c=mvC(o),co=S.rivals[o],r=mrand();
  if(typeof flMajority==='function'&&flMajority()&&!S.fl.bid&&coWorth(o)>0.6*flWorth()&&r<0.3){news(`${mkName(o)} answers with a bid of its own, for the Morven Line.`,'bad',true);flBid(o);return;}
  if(r<0.65&&!c.block){const k=coLive().filter(q=>q!==o&&!RIVAL_P[q].kind&&!trustMember(q)&&flKnightMoney(q)>0.2*c.n*c.px)[0];
    if(k){const q=Math.floor(Math.min(0.2*c.n,mkFree(o)));coPay(k,q*c.px*1.05);c.block={by:k,f:q/c.n};news(`${RIVALS[k].name} takes a ${Math.round(q/c.n*100)}% stake in ${mkName(o)} as a friend of its board. Those shares will not be sold to the Line.`,'bad',true);return;}}
  if(r>=0.65&&r<0.85&&coFleet(o).length>3){const best=coFleet(o).sort((a,b)=>coShipVal(b)-coShipVal(a)).slice(0,2);
    for(const x of best){co.cash+=coShipVal(x)*0.7;dropRival(x);}RW_CACHE.k=null;
    news(`${mkName(o)} sells its two best ships rather than be taken over: scorched earth.`,'bad',true);}}

/* ---------- the rivals' moves against a floated Line ---------- */
function mvAgainst(){const F=S.fl;if(!F||!flOn()||mkShut()||(newCal()&&atWar(S.m)))return;const c=flC();
  // a dawn raid on the Line's shares, when they are cheap: the raider can later bid or fight the board
  if(!F.raider&&!F.bid&&c.px<0.85*flWorth()/F.n&&mrand()<0.004){const o=flBidders()[0];if(o){const q=Math.floor(Math.min(0.2*F.n,F.pub*0.6));coPay(o,q*c.px*1.1);F.pub-=q;F.raider={o,n:q};c.sh*=1.1;
    news(`Dawn raid: ${RIVALS[o].name} has bought ${Math.round(q/F.n*100)}% of the Morven Line overnight. Its intentions are not known.`,'bad',true);}}
  // a bear raid: short the Line's shares and start a rate war on its busiest trade
  if(!F.bid&&mrand()<0.002){const o=coLive().filter(x=>!RIVAL_P[x].kind&&RIVAL_P[x].aggr>=1&&mkInfl(x)<2).sort((a,b)=>coWorth(b)-coWorth(a))[0];
    const n={};for(const x of S.ships)if(x.line&&!isCruise(x.line)&&!S.wars[x.line])n[x.line]=(n[x.line]||0)+1;const rk=Object.keys(n).filter(k=>o&&coFleet(o).some(x=>x.route===k)).sort((a,b)=>n[b]-n[a])[0];
    if(o&&rk){S.wars[rk]={left:6,mult:0.72,multT:0.6,by:[o]};c.sh*=0.88;news(`A bear raid: ${RIVALS[o].name} is selling the Morven Line's shares short and has started a rate war on ${ROUTES[rk].name}. The shares fall.`,'bad',true);}}}
/* the raider's proxy fight at the annual meeting: its shares and the public's discontent against the owner's */
function mvProxyAgainst(){const F=S.fl;if(!F||!flOn()||!F.raider||!coAlive(F.raider.o)||F.conf>=40)return false;
  const a=clamp((70-F.conf)/60,0,0.9),votes=F.raider.n+a*F.pub,own=F.own*(F.founders?FL_VOTES:1),rest=(1-a)*F.pub+(F.knight?F.knight.n:0);
  if(votes>own+rest){S.over='removed';const c=flC();S.removed={t:S.t,conf:F.conf,stake:flOwn(),worth:Math.round(F.own*c.px),by:F.raider.o};UI.speed=0;
    news(`${RIVALS[F.raider.o].name} wins a proxy fight at the annual meeting: with its ${Math.round(F.raider.n/F.n*100)}% and the votes of unhappy shareholders it replaces the board, and you with it.`,'bad',true);save();return true;}
  news(`${RIVALS[F.raider.o].name} forces a vote at the annual meeting and loses. The board stays.`,'good');return false;}
function movesMonth(){if(!S.ex)return;mvTenderClose();mvShortMonth();for(const id in S.ex.cos){const c=S.ex.cos[id];if(c.proxy&&mkStake(id)<MV_PROXY_MIN)c.proxy=false;}mvAgainst();}

/* ---------- on a company's card ---------- */
function movesHTML(o){const M=S.ex,c=mvC(o),shut=mkShut(),k=mkStake(o),s=M.me.short&&M.me.short[o];let h='';
  const rival=mkRival(o)&&!rescueFriend(o);
  if(rescueFriend(o))h+=`<p class="note">${mkName(o)} rescued the Line and holds ${Math.round(S.rescue.stake*100)}% of it: under the terms the Line makes no move against it.</p>`;
  if(rival&&k<MK_CTRL){const rc=mvRaidCost(o);h+=`<div class="btns"><button class="btn" data-act="mvraid" data-id="${o}" ${shut||S.cash<rc||mvRaidQty(o)<1||S.over?'disabled':''}>Dawn raid: ${Math.round(Math.min(MV_RAID,mvRaidQty(o)/c.n)*100)}% today · ${fmt(rc)}</button></div>`;}
  if(rival&&k<0.9&&!trustMember(o)){const T=M.tender;h+=T&&T.o===o?`<p class="note">Your offer of ${pxTxt(T.price)} a share closes in ${monthName(T.due)}.</p>`:`<div class="btns">${[0.2,0.35,0.5].map(p=>{const need=Math.max(0,0.5*c.n-((M.me.pos[o]||{}).n||0))*c.px*(1+p);return `<button class="btn" data-act="mvtender" data-d='${JSON.stringify([o,p])}' ${shut||M.tender||S.cash<need||S.over?'disabled':''}>Tender ${Math.round(p*100)}% over · ${fmt(Math.max(0,mkFree(o))*c.px*(1+p))} if all accept</button>`;}).join('')}</div>`;}
  if(rival&&k>=MV_PROXY_MIN&&mkInfl(o)<2&&!trustMember(o)){const pc=mvProxyCost(o),wait=M.proxyNext&&M.proxyNext[o]>S.m;h+=`<div class="btns"><button class="btn" data-act="mvproxy" data-id="${o}" ${wait||S.cash<pc||S.over?'disabled':''}>Proxy fight · ${fmt(pc)} · about ${Math.round(mvProxyChance(o)*100)}% to win${wait?` (not before ${monthName(M.proxyNext[o])})`:''}</button></div>`;}
  if(c.proxy)h+=`<p class="note">Your nominees hold its board, won in a proxy fight: control while you keep a tenth.</p>`;
  if(o!=='morven'&&!(s)&&M.me.pos[o]&&M.me.pos[o].n>0)h+=`<p class="note">To sell it short, first sell what the Line holds.</p>`;
  else if(o!=='morven'){h+=s?`<p class="note">Short ${int(s.n)} shares: sold for ${fmt(s.col)}, now ${fmt(s.n*c.px)} to buy back; margin ${fmt(s.margin)}; the lender's fee ${fmt(s.n*c.px*MV_SHORT_FEE/12)} a month.</p><div class="btns"><button class="btn" data-act="mvcover" data-id="${o}" ${shut||S.over?'disabled':''}>Buy back the short</button></div>`
      :`<div class="btns">${[0.02,0.05].map(p=>`<button class="btn" data-act="mvshort" data-d='${JSON.stringify([o,p])}' ${shut||S.cash<p*c.n*c.px*MV_SHORT_MARGIN||S.over?'disabled':''}>Sell ${Math.round(p*100)}% short</button>`).join('')}</div>`;}
  if(rival&&s&&atWar(S.m))h+=`<p class="note">No bear raids while the war lasts: the rate wars are suspended.</p>`;
  else if(rival&&s&&!mvBearShort(o))h+=`<p class="note">A bear raid needs a short of at least 2% of the company.</p>`;
  else if(rival&&s){const rks=mvBearRoutes(o);if(rks.length)h+=`<div class="btns">${rks.map(rk=>`<button class="btn danger" data-act="mvbear" data-d='${JSON.stringify([o,rk])}' ${S.over?'disabled':''}>Bear raid: rate war on ${ROUTES[rk].name}</button>`).join('')}</div>`;}
  if(!h)return '';
  return `<div class="ctl"><span class="lbl">Harder moves</span>${h}<p class="note">A dawn raid buys a fifth before the price moves, at a tenth over. A tender offers every holder a price and goes through only if you end with over half; a failed one costs the advisers and some standing. A proxy fight needs a tenth and the Line's name. Selling short pays if the price falls: half the sale as margin, ${Math.round(MV_SHORT_FEE*100)}% a year to the lender, its dividends to pay, and the broker buys you in if the price climbs; big shorts get squeezed. A bear raid adds a rate war on a trade you share, at a quarter off your own fares, and the target may answer in kind.</p></div>`;}
