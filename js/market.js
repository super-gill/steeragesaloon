/* ================= THE SHARE MARKET (0.29, stage R2) =================
   A small London market in shipping and the businesses around it. Every rival line is listed, with eight companies
   next to shipping: two shipbuilders, coal, oil (from 1909), docks, the boat-train railway, a marine insurer and an
   aircraft maker (from 1919). A price follows what the company is worth (its ships, cash and debts, and its earnings),
   the news and the market's mood, which overshoots both ways. The Line can buy and sell, on margin if it likes, and
   collects dividends each quarter; or it hands money to a City broker, or to its own Investment Office, with a brief.
   The market keeps its own dice (mrand), so a game that never touches it plays out exactly as it would without it. */
const MK_FEE_BUY=0.01,MK_FEE_SELL=0.005;      // commission 0.5% each way, and 0.5% stamp duty on a purchase
const MK_LOAN_RATE=0.055;                     // a broker's loan on margin: government stock's 3.5% and two points
const MK_MARGIN=0.5,MK_CALL=0.75;             // borrow up to half; a call when the loan passes three quarters of the shares' value
const MK_BROKER_FEE=0.01;                     // a year, on the money he manages
const MK_SHUT=[ym(1914,6)+1,ym(1915,0)];      // the Stock Exchange closed from 31 July 1914 to 4 January 1915
const MK_BRIEF={preserve:{name:'Preserve',eq:0.3,does:'Mostly government stock and steady dividend shares: docks, railways, insurance.'},
  balanced:{name:'Balanced',eq:0.55,does:'About half in shares, spread between shipping and the steadier companies.'},
  growth:{name:'Growth',eq:0.85,does:'Mostly shares, more of them shipping lines and shipbuilders. Bigger swings.'}};
const MK_STEADY=['Docks','Railway','Insurer','Coal'];
/* the companies next to shipping: earnings a year in 1921 pounds at a normal level, what drives them, and how much they swing */
const MK_REL=[
  {id:'clyde',name:'Clydeside Shipbuilding',kind:'Shipbuilder',e0:60000,sd:0.05,drv:m=>mkBuildDrv(m)},
  {id:'belfast',name:"Queen's Island Shipyard",kind:'Shipbuilder',e0:50000,sd:0.05,drv:m=>mkBuildDrv(m)},
  {id:'coal',name:'Rhondda Steam Coal',kind:'Coal',e0:45000,sd:0.045,drv:m=>clamp(coalPrice(m,true)/(m<M21?preYear(PRE_COAL,m):1.6),0.6,2.2)*(1-0.3*slump(m))},
  {id:'oil',name:'Persian Gulf Oil',kind:'Oil',from:ym(1909,3),e0:40000,sd:0.06,drv:m=>Math.pow(1.08,Math.min(21,(m-ym(1909,3))/12))*(newCal()&&m>=WAR_FROM&&m<=ARMISTICE?1.25:1)*(1-0.3*slump(m))},
  {id:'docks',name:'Mersey and Thames Docks',kind:'Docks',e0:55000,sd:0.025,drv:m=>Math.sqrt(clamp(cargoMod(m),0.3,3))},
  {id:'rail',name:'Western and Southern Railway',kind:'Railway',e0:70000,sd:0.025,drv:m=>clamp(0.5*histMod('t','liv',m)+0.5*histMod('f','liv',m),0.3,3)*(1+0.012*Math.max(0,(m-S.m0)/12))},
  {id:'lloyds',name:'Leadenhall Marine Assurance',kind:'Insurer',e0:40000,sd:0.035,drv:m=>(newCal()&&m>=WAR_FROM&&m<=ARMISTICE?1.3:1)*(1-0.25*slump(m))},
  {id:'air',name:'Imperial Aircraft',kind:'Aircraft',from:ym(1919,5),e0:15000,sd:0.08,drv:m=>Math.pow(1.09,(m-ym(1919,5))/12)*(1-0.4*slump(m))}
];
const MK_REL_BY=Object.fromEntries(MK_REL.map(d=>[d.id,d]));
/* the shipbuilders live on orders: the rivals' and the Line's, the Admiralty's in the war, the boom and the slumps */
function mkBuildDrv(m){const n=(S.rorders||[]).length+(S.orders||[]).length;
  const k=m-M21;return clamp(0.7+0.05*n,0.5,1.8)*(newCal()&&m>=WAR_FROM&&m<=ARMISTICE?1.35:1)*warBuild(m)*(k>=0&&k<36?0.65:1)*(1-0.5*slump(m));}

/* the market's own dice */
function mrand(){const M=S.ex;let a=M.r|0;a=a+0x6D2B79F5|0;M.r=a;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
function mnorm(){let u=0;while(!u)u=mrand();const v=mrand();return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);}
const mkShut=m=>{m=m===undefined?S.m:m;return newCal()&&m>=MK_SHUT[0]&&m<MK_SHUT[1];};
/* the mood of the City: optimism in a boom, fear in a slump, panic in a crash, and a drift of its own */
function mkMoodBase(m){let b=1;
  if(typeof crashF==='function')b-=0.45*crashF(m);                                     // the panics
  if(newCal()&&m>=WAR_FROM&&m<ym(1919,6))b-=m<ym(1915,6)?0.3:m<ym(1919,0)?0.38:0.2;  // the war: War Loan pays better than shares, free of risk
  if(newCal()&&m>ARMISTICE&&m<M21)b+=0.35*Math.max(0,(warShips(m)-1)/1.6);            // the 1919 and 1920 boom
  const k=m-M21;if(k>=0&&k<24)b-=0.3*(1-k/24);                                         // the 1921 slump
  if(m>=ym(1927,0)&&m<ym(1929,9))b+=0.3*Math.min(1,(m-ym(1927,0))/24);                // the late twenties
  if(m>=ym(1929,9)&&m<ym(1929,11))b-=0.35;                                             // the Wall Street crash, before the slump bites
  b-=0.4*slump(m);
  return Math.max(0.35,b);}
const mkMood=()=>S.ex?S.ex.mood:1;
const moodWord=v=>v<0.6?'in a panic':v<0.8?'frightened':v<0.93?'nervous':v<1.08?'steady':v<1.25?'cheerful':'feverish';

/* what a company is worth, in all: the lines on their ships, cash and debts and their earnings; the others on earnings */
function mkFund(id,m){
  const R=MK_REL_BY[id];if(R)return R.e0*PX()*R.drv(m)*10;
  // a line: half on its ships less its debts (cash counts up to a normal reserve: a hoard never reaches the shareholders),
  // half on eight years' earnings; never below a quarter of its ships, which a buyer could always sell
  const co=S.rivals[id];if(!co||co.dead)return 0;const val=coValue(id),e=coProfit(id),fl=0.25*val+1000*PX();
  return 0.5*Math.max(fl,val-co.debt+clamp(co.cash,-val,0.3*val))+0.5*Math.max(fl,e*8);}
const mkListable=(id,m)=>{const R=MK_REL_BY[id];if(R)return !R.from||m>=R.from;return !!(S.rivals[id]&&!S.rivals[id].dead);};
const mkName=id=>MK_REL_BY[id]?MK_REL_BY[id].name:RIVALS[id]?RIVALS[id].name:id;
const mkKind=id=>MK_REL_BY[id]?MK_REL_BY[id].kind:'Shipping line';

function mkEnsure(){
  if(S.ex)return S.ex;
  let h=2166136261;for(const x of (S.rships||[]))for(const ch of x.name+x.built)h=Math.imul(h^ch.charCodeAt(0),16777619);
  S.ex={r:h|0,mood:1,ar:0,cos:{},me:{pos:{},loan:0},fund:null,office:null,idx:[],idx0:null,seen:{},call:null};
  // what happened before the market opened is in the price already
  const M=S.ex;if(S.trust&&S.trust.bought)for(const q of S.trust.bought)M.seen['t'+q.o]=1;for(const o in S.rivals)if(S.rivals[o].rescued)M.seen['r'+o]=1;
  if(S.riband)M.seen.riband=S.riband.o;if(S.dis&&S.dis.owner)M.seen.dis=true;
  mkList(S.m);return S.ex;}
function mkList(m){const M=S.ex;
  for(const id of MK_REL.map(d=>d.id).concat(Object.keys(RIVAL_P)))if(!M.cos[id]&&mkListable(id,m)){
    const F=mkFund(id,m),px0=(0.8+1.6*mrand())*PX()*2.5;const n=Math.max(2000,Math.round(F/px0));M.cos[id]={n,px:F/n,sh:1,div:0,hist:[],since:m};}}
const mkVal=id=>{const c=S.ex.cos[id];return c&&!c.gone?(c.f===undefined?mkFund(id,S.m):c.f)/c.n:0;};    // worth a share, without the mood
const mkCap=id=>{const c=S.ex.cos[id];return c?c.n*c.px:0;};

/* ---------- the month ---------- */
function marketMonth(){
  const M=mkEnsure(),m=S.m;mkList(m);
  M.ar=0.9*M.ar+0.025*mnorm();M.mood=mkMoodBase(m)*Math.exp(M.ar);
  if(newCal()&&m===MK_SHUT[0])news('The Stock Exchange closes its doors until further notice, to stop a panic in the war. No shares can be bought or sold.','hist');
  if(newCal()&&m===MK_SHUT[1])news('The Stock Exchange opens again, under Treasury rules on prices. Dealing in shares resumes.','hist');
  // news the market reads for itself
  if(S.riband&&S.riband.o!==M.seen.riband){M.seen.riband=S.riband.o;if(M.cos[S.riband.o])mkShock(S.riband.o,1.06);}
  if(S.dis&&S.dis.owner&&S.dis.owner!=='morven'&&S.dis.state!=='wait'&&!M.seen.dis){M.seen.dis=true;mkShock(S.dis.owner,0.65,'loses her giant at sea');mkShock('lloyds',0.85);mkShock('belfast',0.9);}
  if(newCal()&&m===WAR_FROM)for(const id in M.cos)if(/German/.test((RIVALS[id]||{}).flag||''))mkShock(id,0.55,'is shut out of the seas by the war');
  const T=S.trust;if(T&&T.bought)for(const q of T.bought)if(!M.seen['t'+q.o]&&M.cos[q.o]){M.seen['t'+q.o]=1;mkShock(q.o,1.2);} // the Combine pays over the odds
  for(const id in M.cos){const co=S.rivals[id];if(co&&co.rescued&&!M.seen['r'+id]){M.seen['r'+id]=1;mkShock(id,0.6,'is reconstructed by its bankers');}}
  const warring=new Set();for(const rk in S.wars||{}){const w=S.wars[rk];for(const o of (w.by||[]))warring.add(o);}
  // prices
  for(const id in M.cos){const c=M.cos[id];if(c.gone)continue;
    if(!mkListable(id,m)){mkDelist(id);continue;}
    if(mkShut(m)){c.hist.push(c.px);if(c.hist.length>120)c.hist.shift();continue;}
    // the price: the company's worth (smoothed, since the market looks through a month's accounts), the mood, the
    // news, and a drift of its own that fades slowly (so a gap from worth is no sure thing to trade on)
    const R=MK_REL_BY[id],sd=R?R.sd:0.045;c.f=c.f===undefined?mkFund(id,m):c.f+0.2*(mkFund(id,m)-c.f);
    // growth beyond the rise in prices is paid for in part with new shares, so a holder keeps only part of it
    const fr=c.f/PX();if(c.fr0===undefined)c.fr0=fr;if(fr>c.fr0){c.n*=Math.pow(fr/c.fr0,0.6);c.fr0=fr;}else c.fr0=Math.max(fr,c.fr0*0.995);
    // two drifts: a quick one that fades in months, and a slow one (fashion, reputation) that takes a decade
    c.e=0.9*(c.e||0)+0.6*sd*mnorm();c.w=0.995*(c.w||0)+0.6*sd*mnorm();c.sh=1+(c.sh-1)*0.85;
    c.px=Math.max(0.004,c.f/c.n*M.mood*c.sh*Math.exp(c.e+(c.w||0))*(warring.has(id)?0.94:1));
    c.hist.push(c.px);if(c.hist.length>120)c.hist.shift();}
  // the shipping share index: the lines together, January of the first year = 100
  const lines=Object.keys(M.cos).filter(id=>!MK_REL_BY[id]&&!M.cos[id].gone),cap=lines.reduce((a,id)=>a+mkCap(id),0),fnd=lines.reduce((a,id)=>a+mkFund(id,m),0);
  if(!M.idx0&&cap>0)M.idx0={cap,fnd};
  if(M.idx0){M.idx.push([m,Math.round(cap/M.idx0.cap*1000)/10,Math.round(fnd/M.idx0.fnd*1000)/10]);if(M.idx.length>600)M.idx.shift();}
  // dividends each quarter, at the end of March, June, September and December
  if(m%3===2)for(const id in M.cos){const c=M.cos[id];if(c.gone)continue;const R=MK_REL_BY[id];let e;
    if(R)e=0.5*R.e0*PX()*R.drv(m);else{const co=S.rivals[id];e=coShort(id)||co.cash<coReserve(id)?0:Math.min(0.5*Math.max(0,coProfit(id)),0.06*(c.f||0));}
    c.div=e/4/c.n;mkPayDiv(id,c.div);}
  mkLoanMonth();mkFundMonth();mkOfficeMonth();
}
function mkShock(id,f,why){const c=S.ex.cos[id];if(!c||c.gone)return;c.sh*=f;
  if(why&&mkHeld(id))news(`${mkName(id)} ${why}: its shares fall sharply. The Line holds ${int(mkHeld(id))}.`,'bad');}
const mkHeld=id=>{const M=S.ex;return ((M.me.pos[id]||{}).n||0)+(M.fund?((M.fund.pos[id]||{}).n||0):0);};
function mkDelist(id){const M=S.ex,c=M.cos[id];c.gone=S.m;c.px=0;const mine=M.me.pos[id],fund=M.fund&&M.fund.pos[id];
  if(mine){book('shares',-mine.cost);S.cash+=mine.cost;delete M.me.pos[id];} // the purchase was paid for already: the loss goes through the books
  if(fund)delete M.fund.pos[id];
  if(mine||fund)news(`${mkName(id)} has failed. Its shares are worthless; the Line's ${int((mine?mine.n:0)+(fund?fund.n:0))} are written off.`,'bad',true);}
function mkPayDiv(id,d){const M=S.ex;if(!(d>0))return;
  const mine=M.me.pos[id];if(mine&&mine.n)book('shares',mine.n*d);
  const f=M.fund&&M.fund.pos[id];if(f&&f.n)M.fund.cash+=f.n*d;}

/* ---------- dealing ---------- */
/* buy (q > 0) or sell (q < 0) q shares for an account; a big order moves the price against itself. Returns the cash
   paid (negative) or received, and on a sale the gain over what the shares cost */
function mkDeal(A,id,q){const c=S.ex.cos[id];if(!c||c.gone||!q||mkShut())return null;
  const h=A.pos[id]||{n:0,cost:0};if(q<0)q=-Math.min(-q,h.n);if(!q)return null;
  const imp=Math.min(0.3,0.6*Math.abs(q)/c.n),p=c.px*(q>0?1+imp/2:1-imp/2),gross=Math.abs(q)*p,fee=gross*(q>0?MK_FEE_BUY:MK_FEE_SELL);
  c.px*=q>0?1+imp:1-imp;c.e=(c.e||0)+Math.log(q>0?1+imp:1-imp);A.pos[id]=h;
  if(q>0){h.n+=q;h.cost+=gross+fee;return {cash:-(gross+fee),gain:0};}
  const basis=h.cost*(-q)/h.n;h.n+=q;h.cost-=basis;if(h.n<=0)delete A.pos[id];
  return {cash:gross-fee,gain:gross-fee-basis};}
const mkPosVal=A=>Object.keys(A.pos).reduce((a,id)=>a+A.pos[id].n*(S.ex.cos[id]?S.ex.cos[id].px:0),0);
/* the Line's own dealing, from the Market tab */
function mkBuy(id,amt,margin){const M=mkEnsure(),c=M.cos[id];if(!c||c.gone||mkShut()||!(amt>0))return false;
  const own=margin?amt*(1-MK_MARGIN):amt;if(S.cash<own)return false;
  const q=Math.floor(amt/(c.px*(1+MK_FEE_BUY+0.3*amt/Math.max(1,c.n*c.px))));if(q<1)return false;
  const r=mkDeal(M.me,id,q);if(!r)return false;S.cash+=r.cash;
  if(margin){const lend=Math.round(-r.cash*MK_MARGIN);M.me.loan+=lend;S.cash+=lend;}
  news(`Bought ${int(q)} shares in ${mkName(id)} for ${fmt(-r.cash)}${margin?', half of it on the broker\'s loan':''}.`);return true;}
function mkSell(id,frac){const M=mkEnsure(),h=M.me.pos[id];if(!h||mkShut())return false;
  const q=frac>=1?h.n:Math.max(1,Math.floor(h.n*frac)),before=mkPosVal(M.me);const r=mkDeal(M.me,id,-q);if(!r)return false;
  S.cash+=r.cash-r.gain;book('shares',r.gain);
  // the sale pays down the margin loan in proportion to the shares sold
  const pay=Math.min(M.me.loan,M.me.loan*r.cash/Math.max(1,before),r.cash);if(pay>0){S.cash-=pay;M.me.loan-=pay;if(M.me.loan<1)M.me.loan=0;}
  news(`Sold ${int(q)} shares in ${mkName(id)} for ${fmt(r.cash)}, ${r.gain>=0?'a gain of '+fmt(r.gain):'a loss of '+fmt(-r.gain)} on what they cost${pay>0?`; ${fmt(pay)} of it repays the broker's loan`:''}.`,r.gain>=0?'good':'');return true;}
function mkRepay(amt){const M=mkEnsure();amt=Math.min(amt,M.me.loan,Math.max(0,S.cash));if(!(amt>0))return false;S.cash-=amt;M.me.loan-=amt;if(M.me.loan<1)M.me.loan=0;return true;}
/* interest on the margin loan, and the broker's call when the shares no longer cover it */
function mkLoanMonth(){const M=S.ex,A=M.me;if(!(A.loan>0)){M.call=null;return;}
  book('shares',-A.loan*MK_LOAN_RATE/12);const v=mkPosVal(A);
  if(M.call&&S.m>=M.call.due){M.call=null;if(A.loan>0.6*v){ // sold up: enough of every holding to bring the loan back to half
      const need=A.loan-0.5*v,f=Math.min(1,need/Math.max(1,v)*1.1);let raised=0;
      for(const id of Object.keys(A.pos)){const q=Math.ceil(A.pos[id].n*f),r=mkDeal(A,id,-q);if(!r)continue;raised+=r.cash;book('shares',r.gain);S.cash+=r.cash-r.gain;}
      const pay=Math.min(A.loan,Math.max(0,raised));S.cash-=pay;A.loan-=pay;
      news(`The broker has sold ${fmt(raised)} of the Line's shares at the market to cover its loan.`,'bad',true);}}
  else if(!M.call&&A.loan>MK_CALL*v&&!mkShut()){M.call={due:S.m+1,amt:Math.round(A.loan-0.5*v)};
    news(`Margin call: the Line's shares no longer cover the broker's loan. Pay in ${fmt(M.call.amt)} or sell by ${monthName(M.call.due)}, or the broker sells at the market.`,'bad',true);}
  if(M.call&&A.loan<=0.6*v)M.call=null;}

/* ---------- the managed account: a City broker, or the Line's own Investment Office ---------- */
const mkFundVal=F=>F?F.cash+F.gilts+mkPosVal(F):0;
const mkWorth=()=>{if(!S.ex)return 0;const M=S.ex;return mkPosVal(M.me)-M.me.loan+mkFundVal(M.fund);};
const mkSkill=()=>{const M=S.ex,F=M.fund;if(!F)return 0;return F.mgr==='office'&&M.office?M.office.head.comp/100:F.skill;};
function mkFundOpen(mgr){const M=mkEnsure();if(M.fund)return false;if(mgr==='office'&&!M.office)return false;
  M.fund={mgr,brief:'balanced',cash:0,gilts:0,pos:{},paidIn:0,giltEq:0,since:S.m,due:S.m,skill:0.3+0.3*mrand(),broker:`${['Cazenove','Rowe','Panmure','Grieveson','Laurie'][Math.floor(mrand()*5)]} & Co.`,rep:null,q0:0};
  news(mgr==='office'?'The Investment Office takes charge of the Line\'s investment account.':`${M.fund.broker}, stockbrokers, open an investment account for the Line. Their fee is 1% a year of what they manage.`);return true;}
function mkFundPay(amt){const M=mkEnsure(),F=M.fund;if(!F)return false;amt=Math.min(amt,Math.floor(Math.max(0,S.cash)));if(amt<=0)return false;
  S.cash-=amt;F.cash+=amt;F.paidIn+=amt;F.giltEq+=amt;F.due=Math.min(F.due,S.m);return true;}
/* money out: from the account's cash and stock first, then shares sold across the board */
function mkFundTake(amt,close){const M=S.ex,F=M.fund;if(!F||mkShut())return false;const v=mkFundVal(F);amt=close?v:Math.min(amt,v);if(amt<=0)return false;
  let got=0;const take=x=>{got+=x;};
  const c=Math.min(F.cash,amt);F.cash-=c;take(c);
  const g=Math.min(F.gilts,amt-got);F.gilts-=g;take(g*0.995);
  if(got<amt-1){const pv=mkPosVal(F),f=close?1:Math.min(1,(amt-got)/Math.max(1,pv)*1.02);
    for(const id of Object.keys(F.pos)){const q=close?F.pos[id].n:Math.ceil(F.pos[id].n*f),r=mkDeal(F,id,-q);if(r)take(r.cash);}}
  S.cash+=got;const share=Math.min(1,got/Math.max(1,v));F.paidIn*=1-share;F.giltEq*=1-share;
  if(close){news(`The investment account is closed. ${fmt(got)} comes back to the Line.`);if(F.cash>0)S.cash+=F.cash;M.fund=null;}
  else news(`${fmt(got)} is taken out of the investment account.`);return true;}
function mkFundMonth(){const M=S.ex,F=M.fund;if(!F)return;
  F.gilts*=1+0.035/12;F.giltEq*=1+0.035/12;
  const v=mkFundVal(F);if(F.mgr==='broker')F.cash-=v*MK_BROKER_FEE/12;
  if(F.cash<0){const g=Math.min(F.gilts,-F.cash);F.gilts-=g;F.cash+=g;}
  if(mkShut())return;
  if(S.m>=F.due){mkRebalance(F);F.due=S.m+3;}
  if(S.m%3===2){const q=mkFundVal(F),was=F.q0||F.paidIn;F.q0=q;const who=F.mgr==='office'?'The Investment Office':F.broker;
    F.rep=`${who} report${F.mgr==='office'?'s':''} for the quarter: the account stands at ${fmt(q)}, ${q>=was?'up':'down'} ${Math.abs(Math.round((q/Math.max(1,was)-1)*1000)/10)}%. Paid in, less taken out: ${fmt(F.paidIn)}. The same in government stock would be ${fmt(F.giltEq)}. The market is ${moodWord(M.mood)}.`;
    news(F.rep,'');}}
/* each quarter the manager decides how much goes in shares and which: the brief sets the level, a good manager leans
   against the mood (fewer shares in a boom, more in a panic) and reads a company's worth more truly */
function mkRebalance(F){const M=S.ex,sk=mkSkill(),B=MK_BRIEF[F.brief];
  const tot=mkFundVal(F);if(tot<=0)return;
  const w=clamp(B.eq*(1+sk*0.6*(1-M.mood)),0.1,0.95);
  // no line in trouble, nor one floated in the last two years; a sharp manager keeps off the stretched ones too
  const ids=Object.keys(M.cos).filter(id=>{const c=M.cos[id];if(c.gone||c.px<0.01)return false;if(MK_REL_BY[id])return true;
    const hl=coHealth(id)[0];return S.m-c.since>=24&&hl!=='In trouble'&&hl!=='Failed'&&!(hl==='Stretched'&&mrand()<sk);});
  const score=id=>{const c=M.cos[id],r=mkVal(id)/c.px,noise=(0.2+(1-sk)*0.4)*mnorm(),k=mkKind(id);
    const pref=F.brief==='preserve'?(MK_STEADY.includes(k)?0.25:-0.15):F.brief==='growth'?(MK_STEADY.includes(k)?-0.1:0.1):0;
    return Math.log(Math.max(0.05,r))+noise+pref+(F.brief==='preserve'?4*c.div*4/c.px:0);};
  const nP=F.brief==='growth'?8:7,ranked=ids.map(id=>[id,score(id)]).sort((a,b)=>b[1]-a[1]),pick=ranked.slice(0,nP).map(x=>x[0]),keep=new Set(ranked.slice(0,nP+3).map(x=>x[0]));
  const each=tot*w/pick.length;
  // sell what has fallen out of favour, then trim and top up
  for(const id of Object.keys(F.pos))if(!keep.has(id)){const r=mkDeal(F,id,-F.pos[id].n);if(r)F.cash+=r.cash;}
  for(const id of Object.keys(F.pos)){const cur=F.pos[id].n*M.cos[id].px,tgt=pick.includes(id)?each:Math.min(cur,each);
    if(cur>tgt*1.15){const r=mkDeal(F,id,-Math.floor((cur-tgt)/M.cos[id].px));if(r)F.cash+=r.cash;}}
  const giltT=tot*(1-w)*0.97;if(F.gilts>giltT){F.cash+=(F.gilts-giltT)*0.995;F.gilts=giltT;}
  for(const id of pick){const cur=(F.pos[id]?F.pos[id].n:0)*M.cos[id].px;if(cur<each*0.85){
      const spend=Math.min(each-cur,F.cash-tot*0.02);if(spend<=0)continue;const q=Math.floor(spend/(M.cos[id].px*(1+MK_FEE_BUY+0.3*spend/Math.max(1,mkCap(id)))));
      if(q>0){const r=mkDeal(F,id,q);if(r)F.cash+=r.cash;}}}
  if(F.cash>tot*0.03){const g=F.cash-tot*0.03;F.cash-=g;F.gilts+=g;}}

/* ---------- the Investment Office ---------- */
const MK_OFFICE_COST=6000;
const mkOfficeRun=()=>{const O=S.ex&&S.ex.office;return O?O.head.wage+3*CLERK_WAGE+Math.round(50*PX()):0;};
function mkOfficeOpen(){const M=mkEnsure();if(M.office)return false;const c=Math.round(MK_OFFICE_COST*PX());if(S.cash<c)return false;
  book('office',-c);M.office={head:makeHead('invest',mrand),since:S.m,adv:[]};mkOfficeAdvice();
  news(`The Investment Office opens at head office, under ${M.office.head.name}.`,'good');return true;}
function mkOfficeClose(){const M=S.ex;if(!M||!M.office)return false;M.office=null;if(M.fund&&M.fund.mgr==='office')M.fund.mgr='broker';news('The Investment Office is closed. The investment account goes to the brokers.');return true;}
function mkOfficeMonth(){const M=S.ex,O=M.office;if(!O)return;book('office',-mkOfficeRun());if(S.m%3===0||!O.adv)mkOfficeAdvice();}
/* its advice, each quarter: a weaker head reads a company's worth less truly */
function mkOfficeAdvice(){const M=S.ex,O=M.office,sk=O.head.comp/100,out=[];
  const est=id=>mkVal(id)/M.cos[id].px*Math.exp((0.15+(1-sk)*0.4)*mnorm());
  const live=Object.keys(M.cos).filter(id=>!M.cos[id].gone&&M.cos[id].px>0.01);
  if(M.mood<0.8)out.push({k:'good',t:`The market is ${moodWord(M.mood)}. Shares are cheap against what the companies own: a time to buy with cash, not with borrowed money.`});
  if(M.mood>1.2)out.push({k:'bad',t:`The market is ${moodWord(M.mood)}. Prices are running ahead of what the companies are worth; a time to take profits and keep cash.`});
  const cheap=live.map(id=>[id,est(id)]).filter(x=>x[1]>1.35).sort((a,b)=>b[1]-a[1]).slice(0,3);
  for(const [id,r] of cheap)out.push({k:'good',id,act:'buy',t:`${mkName(id)} trades at about ${Math.round(100/r)}% of what the Office thinks it is worth.`});
  for(const id of Object.keys(M.me.pos)){const r=est(id);if(r<0.75)out.push({k:'warn',id,act:'sell',t:`${mkName(id)} is dear: about ${Math.round(100/r)}% of its worth. The Office would sell.`});}
  if(M.me.loan>0.6*mkPosVal(M.me))out.push({k:'bad',t:'The margin loan is close to a call. Pay some of it off, or sell, before the broker does it for you.'});
  O.adv=out;}

/* ---------- the Market tab ---------- */
const pxTxt=p=>{if(!(p>0))return '–';let L=Math.floor(p),s=Math.floor((p-L)*20),d=Math.round(((p-L)*20-s)*12);if(d===12){d=0;s++;}if(s===20){s=0;L++;}
  return (L?`£${L} `:'')+`${s}s`+(d?` ${d}d`:'');};
const pctS=v=>(v>=0?'+':'−')+Math.abs(Math.round(v*1000)/10)+'%';
function mkSpark(vals,w=180,h=34){if(vals.length<2)return '';const lo=Math.min(...vals),hi=Math.max(...vals),r=hi-lo||1;
  const pts=vals.map((v,i)=>`${(i/(vals.length-1)*w).toFixed(1)},${(h-2-(v-lo)/r*(h-4)).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--brass)" stroke-width="1.5"/></svg>`;}
function mkIdxChart(){const I=S.ex.idx.slice(-240);if(I.length<3)return '';const W=460,H=120,lo=Math.min(...I.map(q=>Math.min(q[1],q[2]))),hi=Math.max(...I.map(q=>Math.max(q[1],q[2]))),r=hi-lo||1;
  const X=i=>(i/(I.length-1)*(W-40)+36).toFixed(1),Y=v=>(H-16-(v-lo)/r*(H-26)).toFixed(1);
  const line=(k,st)=>`<polyline points="${I.map((q,i)=>X(i)+','+Y(q[k])).join(' ')}" fill="none" stroke="${st}" stroke-width="${k===1?1.8:1.2}"${k===2?' stroke-dasharray="4 3"':''}/>`;
  const yrs=I.filter(q=>q[0]%60===0);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Shipping share index against what the lines are worth">
    <text x="2" y="${Y(hi)}" font-size="10" fill="var(--muted)">${Math.round(hi)}</text><text x="2" y="${Y(lo)}" font-size="10" fill="var(--muted)">${Math.round(lo)}</text>
    ${yrs.map(q=>`<text x="${X(I.indexOf(q))}" y="${H-2}" font-size="10" fill="var(--muted)" text-anchor="middle">${YEAR0+q[0]/12}</text>`).join('')}
    ${line(2,'var(--muted)')}${line(1,'var(--brass)')}</svg>
    <p class="note">Solid: the shipping share index. Dashed: what the lines are worth, at the same start. The gap is the market's mood.</p>`;}
function exchangeHTML(){
  const M=mkEnsure(),shut=mkShut(),A=M.me,sel=UI.mkSel,O=M.office,F=M.fund;
  const amts=[500,5000,50000].map(v=>Math.round(v*PX()/100)*100);
  const live=Object.keys(M.cos).filter(id=>!M.cos[id].gone).sort((a,b)=>(MK_REL_BY[a]?1:0)-(MK_REL_BY[b]?1:0)||mkCap(b)-mkCap(a));
  const I=M.idx[M.idx.length-1];
  const head=`<section class="sec"><h2>The Stock Exchange</h2>
    <p class="${M.mood<0.8?'badline':M.mood>1.2?'warnline':'note'}">${shut?'The Stock Exchange is closed for the war. Dealing resumes in January 1915.':`The market is ${moodWord(M.mood)}.${I?` Shipping shares stand at ${Math.round(I[1])} (${Math.round(I[1]/Math.max(1,I[2])*100)}% of what the lines are worth).`:''}`}</p>
    ${mkIdxChart()}
    <p class="note">You never have to deal here. Prices follow what each company owns and earns, the news and the mood of the City. Buying costs 1% (commission and stamp duty), selling 0.5%, and a big order moves the price against you.</p></section>`;
  const pv=mkPosVal(A),held=Object.keys(A.pos);
  const mine=`<section class="sec"><h2>The Line's shares</h2>
    ${held.length?`<div class="tablewrap"><table class="mkt"><tr><th>Company</th><th class="r">Shares</th><th class="r">Price</th><th class="r">Value</th><th class="r">Gain</th></tr>
      ${held.map(id=>{const h=A.pos[id],c=M.cos[id],v=h.n*c.px;return `<tr data-act="mksel" data-id="${id}"><td>${esc(mkName(id))}</td><td class="r num">${int(h.n)}</td><td class="r num">${pxTxt(c.px)}</td><td class="r num">${fmt(v)}</td><td class="r num ${v>=h.cost?'pos':'neg'}">${fmt(v-h.cost)}</td></tr>`;}).join('')}</table></div>`:'<p class="note">None. Pick a company below to buy.</p>'}
    <dl class="kv"><dt>Shares at market</dt><dd>${fmt(pv)}</dd><dt>Broker's loan (margin)</dt><dd>${fmt(A.loan)}</dd>${A.loan>0?`<dt>Interest</dt><dd>${fmt(A.loan*MK_LOAN_RATE/12)}/mo</dd><dt>Loan to value</dt><dd>${Math.round(A.loan/Math.max(1,pv)*100)}%</dd>`:''}</dl>
    ${M.call?`<p class="badline">Margin call: pay in ${fmt(M.call.amt)} or sell by ${monthName(M.call.due)}.</p>`:''}
    ${A.loan>0?`<div class="btns">${[...amts,A.loan].filter((v,i,a)=>v<=A.loan&&a.indexOf(v)===i).map(v=>`<button class="btn" data-act="mkrepay" data-id="${Math.round(v)}" ${S.cash<v||S.over?'disabled':''}>Repay ${v===A.loan?'all':fmt(v)}</button>`).join('')}</div>`:''}</section>`;
  const rows=live.map(id=>{const c=M.cos[id],h=c.hist,chg=h.length>1?c.px/h[h.length-2]-1:0,yld=4*c.div/c.px,val=mkVal(id);
    return `<tr data-act="mksel" data-id="${id}"${sel===id?' aria-selected="true" class="cur"':''}><td><strong>${esc(mkName(id))}</strong><div class="meta">${mkKind(id)}${!MK_REL_BY[id]&&RIVALS[id]?' · '+esc(RIVALS[id].flag.split(',')[0]):''}</div></td>
      <td class="r num">${pxTxt(c.px)}</td><td class="r num ${chg>=0?'pos':'neg'}">${pctS(chg)}</td><td class="r num">${yld>0?(yld*100).toFixed(1)+'%':'–'}</td><td class="r num">${O?Math.round(c.px/Math.max(1e-6,val)*100)+'%':'–'}</td><td class="r num">${A.pos[id]?int(A.pos[id].n):''}</td></tr>`;}).join('');
  let detail='';
  if(sel&&M.cos[sel]&&!M.cos[sel].gone){const c=M.cos[sel],h=A.pos[sel];
    detail=`<div class="card"><div class="row"><strong>${esc(mkName(sel))}</strong><span class="num">${pxTxt(c.px)}</span></div>
      <div class="meta">${mkKind(sel)} · ${int(c.n)} shares · worth ${fmt(mkCap(sel))} at the market${!MK_REL_BY[sel]&&S.rivals[sel]?` · ${coFleet(sel).length} ships, ${coHealth(sel)[0].toLowerCase()}`:''} · last dividend ${c.div>0?pxTxt(c.div)+' a share':'none'}</div>
      ${mkSpark(c.hist.slice(-60))}<p class="note">Five years of prices.</p>
      <div class="btns">${amts.map(v=>`<button class="btn" data-act="mkbuy" data-d='${JSON.stringify([sel,v,0])}' ${shut||S.cash<v||S.over?'disabled':''}>Buy ${fmt(v)}</button>`).join('')}</div>
      <div class="btns">${amts.map(v=>`<button class="btn" data-act="mkbuy" data-d='${JSON.stringify([sel,v,1])}' ${shut||S.cash<v*(1-MK_MARGIN)||S.over?'disabled':''}>Buy ${fmt(v)} on margin</button>`).join('')}</div>
      ${h?`<div class="btns"><button class="btn" data-act="mksell" data-d='${JSON.stringify([sel,0.5])}' ${shut||S.over?'disabled':''}>Sell half</button><button class="btn" data-act="mksell" data-d='${JSON.stringify([sel,1])}' ${shut||S.over?'disabled':''}>Sell all ${int(h.n)}</button></div>`:''}
      <p class="note">On margin the broker lends half, at ${Math.round(MK_LOAN_RATE*1000)/10}% a year. If the shares fall until the loan passes three quarters of their value he calls for money, and sells at the market if it does not come within a month.</p></div>`;}
  const list=`<section class="sec"><h2>Listed companies</h2>${detail}
    <div class="tablewrap"><table class="mkt"><tr><th>Company</th><th class="r">Price</th><th class="r">Month</th><th class="r">Yield</th><th class="r" title="Price against what the Investment Office thinks it is worth">Price to worth</th><th class="r">Held</th></tr>${rows}</table></div>
    ${O?'':'<p class="note">An Investment Office would show what each company is worth against its price.</p>'}</section>`;
  const fv=mkFundVal(F);
  const fund=`<section class="sec"><h2>The investment account</h2>
    ${F?`<p class="note">Managed by ${F.mgr==='office'?'the Investment Office':esc(F.broker)}${F.mgr==='broker'?' for 1% a year':''}, since ${monthName(F.since)}. It holds government stock and shares to its brief and rebalances each quarter.</p>
      <dl class="kv"><dt>Value</dt><dd>${fmt(fv)}</dd><dt>Paid in, less taken out</dt><dd>${fmt(F.paidIn)}</dd><dt>The same in government stock</dt><dd>${fmt(F.giltEq)}</dd><dt>In shares</dt><dd>${Math.round(mkPosVal(F)/Math.max(1,fv)*100)}%</dd></dl>
      <div class="seg" role="group" aria-label="Brief">${Object.keys(MK_BRIEF).map(k=>`<button data-act="fundbrief" data-id="${k}" aria-pressed="${F.brief===k}">${MK_BRIEF[k].name}</button>`).join('')}</div>
      <p class="note">${MK_BRIEF[F.brief].does}</p>
      <div class="btns">${amts.map(v=>`<button class="btn" data-act="funddep" data-id="${v}" ${S.cash<v||S.over?'disabled':''}>Pay in ${fmt(v)}</button>`).join('')}</div>
      <div class="btns">${amts.filter(v=>v<fv).map(v=>`<button class="btn" data-act="fundwd" data-id="${v}" ${shut||S.over?'disabled':''}>Take out ${fmt(v)}</button>`).join('')}<button class="btn danger" data-act="fundclose" ${shut||S.over?'disabled':''}>${UI.confirm==='fundclose'?'Confirm: sell everything and close':'Close the account'}</button></div>
      ${O&&F.mgr==='broker'?'<button class="btn" data-act="fundmgr" data-id="office">Hand it to the Investment Office</button>':''}${F.mgr==='office'?'<button class="btn" data-act="fundmgr" data-id="broker">Hand it to a broker</button>':''}
      ${F.rep?`<p class="note">${esc(F.rep)}</p>`:''}`
    :`<p class="note">Give money and a brief to a City broker, who manages it for 1% a year. Expect a little more than government stock over the years, with more ups and downs, and losses in a crash. Nobody gets rich this way.</p>
      <div class="btns"><button class="btn" data-act="fundopen" data-id="broker" ${S.over?'disabled':''}>Open an account with a broker</button>${O?'<button class="btn" data-act="fundopen" data-id="office">Open one run by the Investment Office</button>':''}</div>`}</section>`;
  const oc=Math.round(MK_OFFICE_COST*PX());
  const office=`<section class="sec"><h2>The Investment Office</h2>
    ${O?`<p class="note">${esc(O.head.name)}, a ${compWord(O.head.comp)} head, with three clerks: ${fmt(mkOfficeRun())} a month. The Office tells you what each company is worth against its price, advises each quarter, and can run the investment account with no broker's fee.</p>
      ${(O.adv||[]).length?O.adv.map(a=>`<div class="advice ${a.k==='bad'?'bad':a.k==='warn'?'warn':''}"><span class="note">${esc(a.t)}</span>${a.id?`<div class="btns"><button class="btn" data-act="mksel" data-id="${a.id}">${a.act==='buy'?'Look at it':'See the holding'}</button></div>`:''}</div>`).join(''):'<p class="note">Nothing to report this quarter.</p>'}
      <button class="btn quiet" data-act="officeclose">${UI.confirm==='officeclose'?'Confirm: close the Office':'Close the Office'}</button>`
    :`<p class="note">A department of your own, instead of a broker: ${fmt(oc)} to set up and about ${fmt(Math.round((65*PX()+3*CLERK_WAGE+50*PX())))} a month and up, by its head. It advises on every company and can run the investment account itself. A good head beats a broker; a poor one does worse.</p>
      <button class="btn" data-act="officeopen" ${S.cash<oc||S.over?'disabled':''}>Open the Investment Office · ${fmt(oc)}</button>`}</section>`;
  return head+mine+list+fund+office;
}
