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
  if(id==='morven')return typeof flOn==='function'&&flOn()?flWorth():0; // the Line itself, once floated
  const R=MK_REL_BY[id];if(R)return R.e0*PX()*R.drv(m)*10;
  // a line: half on its ships less its debts (cash counts up to a normal reserve: a hoard never reaches the shareholders),
  // half on eight years' earnings; never below a quarter of its ships, which a buyer could always sell
  const co=S.rivals[id];if(!co||co.dead)return 0;const val=coValue(id),e=coProfit(id),fl=0.25*val+1000*PX();
  const cash=co.cash<0?Math.max(co.cash,-val):Math.min(co.cash,0.3*val)+0.7*Math.max(0,co.cash-0.3*val)-(co.lineLoan||0); // cash over a normal reserve counts at seven tenths: it is the shareholders' in the end (0.34)
  return 0.5*Math.max(fl,val-co.debt+cash)+0.5*Math.max(fl,e*8);}
const mkListable=(id,m)=>{if(id==='morven')return typeof flOn==='function'&&flOn();const R=MK_REL_BY[id];if(R)return !R.from||m>=R.from;return !!(S.rivals[id]&&!S.rivals[id].dead);};
const mkName=id=>id==='morven'?'The Morven Line':MK_REL_BY[id]?MK_REL_BY[id].name:RIVALS[id]?RIVALS[id].name:id;
const mkRival=id=>!MK_REL_BY[id]&&id!=='morven';
const mkKind=id=>id==='morven'?'Your line':MK_REL_BY[id]?MK_REL_BY[id].kind:'Shipping line';

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
    const F=mkFund(id,m),px0=(0.8+1.6*mrand())*PX()*2.5;const n=Math.max(2000,Math.round(F/px0));M.cos[id]={n,px:F/n,sh:1,dy:0,hist:[],since:m};}}
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
    const R=MK_REL_BY[id],sd=R?R.sd:0.045;{const F0=mkFund(id,m);c.f=c.f===undefined?F0:c.f+(F0<c.f?0.45:0.2)*(F0-c.f);} // the City marks a company down faster than up
    // growth beyond the rise in prices is paid for in part with new shares, so a holder keeps only part of it
    const fr=c.f/PX();if(c.fr0===undefined)c.fr0=fr;if(fr>c.fr0){if(mkStake(id)<0.5&&id!=='morven')c.n*=Math.pow(fr/c.fr0,0.6);c.fr0=fr;}else c.fr0=Math.max(fr,c.fr0*0.995); // a board the Line controls issues no shares over its head
    // two drifts: a quick one that fades in months, and a slow one (fashion, reputation) that takes a decade
    c.e=0.9*(c.e||0)+0.6*sd*mnorm();c.w=0.995*(c.w||0)+0.6*sd*mnorm();c.sh=1+(c.sh-1)*0.85;
    if(c.own)c.own=Math.abs(c.own)<1e-4?0:0.9*c.own;if(c.ownS)c.ownS=1+(c.ownS-1)*0.85; // the Line's own push on the price fades with the rest
    c.px=Math.max(0.004,c.f/c.n*M.mood*c.sh*Math.exp(c.e+(c.w||0))*(warring.has(id)?0.94:1)*(id==='morven'&&S.fl&&S.fl.founders?FL_FOUNDERS:1));
    c.hist.push(c.px);if(c.hist.length>120)c.hist.shift();}
  // the shipping share index: the lines together, January of the first year = 100
  const lines=Object.keys(M.cos).filter(id=>mkRival(id)&&!M.cos[id].gone),cap=lines.reduce((a,id)=>a+mkCap(id),0),fnd=lines.reduce((a,id)=>a+mkFund(id,m),0);
  if(!M.idx0&&cap>0)M.idx0={cap,fnd};
  if(M.idx0){M.idx.push([m,Math.round(cap/M.idx0.cap*1000)/10,Math.round(fnd/M.idx0.fnd*1000)/10]);if(M.idx.length>600)M.idx.shift();}
  // dividends each quarter, at the end of March, June, September and December
  // the companies next to shipping pay each quarter; a line pays once a year, the dividend its directors vote in January
  // (coYearEnd, out of its own cash), reaching the shareholders in February
  if(m%3===2)for(const id in M.cos){const c=M.cos[id],R=MK_REL_BY[id];if(c.gone||!R)continue;const e=0.5*R.e0*PX()*R.drv(m);c.dy=e/c.n;mkPayDiv(id,e/4/c.n);}
  if(m%12===1)for(const id in M.cos){const c=M.cos[id],co=S.rivals[id];if(c.gone||MK_REL_BY[id]||!co)continue;c.dy=(co.div||0)/c.n;mkPayDiv(id,c.dy);}
  mkControlMonth();if(typeof floatMonth==='function')floatMonth();if(typeof movesMonth==='function')movesMonth();mkLoanMonth();mkFundMonth();mkOfficeMonth();
}
function mkShock(id,f,why){const c=S.ex.cos[id];if(!c||c.gone)return;c.sh*=f;
  if(why&&mkHeld(id))news(`${mkName(id)} ${why}: its shares fall sharply. The Line holds ${int(mkHeld(id))}.`,'bad');}
const mkHeld=id=>{const M=S.ex;return ((M.me.pos[id]||{}).n||0)+(M.fund?((M.fund.pos[id]||{}).n||0):0);};
function mkDelist(id){const M=S.ex,c=M.cos[id];c.gone=S.m;c.px=0;const co=S.rivals[id];if(co&&co.lineLoan>0&&!co.merged){book('shares',-co.lineLoan);S.cash+=co.lineLoan;news(`The Line's loan of ${fmt(co.lineLoan)} to ${mkName(id)} is lost with it.`,'bad');co.lineLoan=0;}const mine=M.me.pos[id],fund=M.fund&&M.fund.pos[id];
  if(mine){book('shares',-mine.cost);S.cash+=mine.cost;delete M.me.pos[id];} // the purchase was paid for already: the loss goes through the books
  if(fund)delete M.fund.pos[id];
  if(mine||fund)news(`${mkName(id)} has failed. Its shares are worthless; the Line's ${int((mine?mine.n:0)+(fund?fund.n:0))} are written off.`,'bad',true);}
function mkPayDiv(id,d){const M=S.ex;if(!(d>0))return;if(typeof mvShortDiv==='function')mvShortDiv(id,d);
  const mine=M.me.pos[id];if(mine&&mine.n)book('shares',mine.n*d);
  const f=M.fund&&M.fund.pos[id];if(f&&f.n)M.fund.cash+=f.n*d;}

/* ---------- dealing ---------- */
/* buy (q > 0) or sell (q < 0) q shares for an account; a big order moves the price against itself. Returns the cash
   paid (negative) or received, and on a sale the gain over what the shares cost */
function mkDeal(A,id,q){const c=S.ex.cos[id];if(!c||c.gone||!q||mkShut())return null;
  const h=A.pos[id]||{n:0,cost:0};if(q<0)q=-Math.min(-q,h.n);if(!q)return null;
  const imp=Math.min(0.5,0.6*Math.abs(q)/Math.max(1,mkFree(id)+(q<0?-q:0))),p=c.px*(q>0?1+imp/2:1-imp/2),gross=Math.abs(q)*p,fee=gross*(q>0?MK_FEE_BUY:MK_FEE_SELL);
  c.px*=q>0?1+imp:1-imp;c.e=(c.e||0)+Math.log(q>0?1+imp:1-imp);A.pos[id]=h;if(A===S.ex.me)mkOwnPush(id,Math.log(q>0?1+imp:1-imp));
  if(q>0){h.n+=q;h.cost+=gross+fee;return {cash:-(gross+fee),gain:0};}
  const basis=h.cost*(-q)/h.n;h.n+=q;h.cost-=basis;if(h.n<=0)delete A.pos[id];
  return {cash:gross-fee,gain:gross-fee-basis};}
/* the Line's own buying and selling moves a price, and the City's excitement at a stake or a bid moves it more. Its own
   holdings are valued without that push (0.35.2): otherwise buying half a line put a quarter of the money spent straight
   back on the books as a paper gain, until the price drifted back over the following months */
function mkOwnPush(id,lg,sh){const c=S.ex.cos[id];if(!c)return;if(lg)c.own=(c.own||0)+lg;if(sh)c.ownS=(c.ownS||1)*sh;}
const mkFair=id=>{const c=S.ex.cos[id];return c&&!c.gone?c.px/Math.exp(c.own||0)/(c.ownS||1):0;};
const mkPosVal=A=>Object.keys(A.pos).reduce((a,id)=>a+A.pos[id].n*(S.ex.cos[id]?(A===S.ex.me?mkFair(id):S.ex.cos[id].px):0),0);
/* the Line's own dealing, from the Market tab */
function mkBuy(id,amt,margin){const M=mkEnsure(),c=M.cos[id];if(!c||c.gone||mkShut()||!(amt>0)||(M.me.short&&M.me.short[id]))return false; // buy back the short first
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
const mkLoans=()=>{let v=0;for(const o in S.rivals){const co=S.rivals[o];if(co.lineLoan>0&&!co.dead)v+=co.lineLoan;}return v;};
const mkWorth=()=>{if(!S.ex)return 0;const M=S.ex;return mkPosVal(M.me)-M.me.loan+mkFundVal(M.fund)+(typeof mvShortsVal==='function'?mvShortsVal():0)+mkLoans();};
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
  {const p=giltPrice(),tr=F.gp?(p+GILT_COUPON/12)/F.gp:1+GILT_COUPON/100/12;F.gp=p;F.gilts*=tr;F.giltEq*=tr;} // Consols' interest and their price together (0.35.1)
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
  const ids=Object.keys(M.cos).filter(id=>{const c=M.cos[id];if(c.gone||c.px<0.01||id==='morven')return false;if(MK_REL_BY[id])return true;
    const hl=coHealth(id)[0];return S.m-c.since>=24&&hl!=='In trouble'&&hl!=='Failed'&&!(hl==='Stretched'&&mrand()<sk);});
  const score=id=>{const c=M.cos[id],r=mkVal(id)/c.px,noise=(0.2+(1-sk)*0.4)*mnorm(),k=mkKind(id);
    const pref=F.brief==='preserve'?(MK_STEADY.includes(k)?0.25:-0.15):F.brief==='growth'?(MK_STEADY.includes(k)?-0.1:0.1):0;
    return Math.log(Math.max(0.05,r))+noise+pref+(F.brief==='preserve'?4*(c.dy||0)/c.px:0);};
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
function mkOfficeMonth(){const M=S.ex,O=M.office;if(!O)return;book('office',-mkOfficeRun());if(S.m%3===0||!O.adv)mkOfficeAdvice();if(S.m%3===0||!O.cands)O.cands=[makeHead('invest',mrand),makeHead('invest',mrand)];}
/* a new head for the Office, from the quarter's candidates: the old one is paid three months' wages to go */
function mkOfficeHire(i){const O=S.ex&&S.ex.office;if(!O||!O.cands||!O.cands[i])return false;const sev=O.head.wage*3;if(S.cash<sev)return false;
  book('office',-sev);const old=O.head.name;O.head=O.cands[i];O.cands.splice(i,1);mkOfficeAdvice();news(`${O.head.name} takes over the Investment Office from ${old}.`);return true;}
/* its advice, each quarter: a weaker head reads a company's worth less truly */
function mkOfficeAdvice(){const M=S.ex,O=M.office,sk=O.head.comp/100,out=[];
  const est=id=>mkVal(id)/M.cos[id].px*Math.exp((0.15+(1-sk)*0.4)*mnorm());
  const live=Object.keys(M.cos).filter(id=>!M.cos[id].gone&&M.cos[id].px>0.01&&id!=='morven');
  if(M.mood<0.8)out.push({k:'good',t:`The market is ${moodWord(M.mood)}. Shares are cheap against what the companies own: a time to buy with cash, not with borrowed money.`});
  if(M.mood>1.2)out.push({k:'bad',t:`The market is ${moodWord(M.mood)}. Prices are running ahead of what the companies are worth; a time to take profits and keep cash.`});
  const cheap=live.map(id=>[id,est(id)]).filter(x=>x[1]>1.35).sort((a,b)=>b[1]-a[1]).slice(0,3);
  for(const [id,r] of cheap)out.push({k:'good',id,act:'buy',t:`${mkName(id)} trades at about ${Math.round(100/r)}% of what the Office thinks it is worth.`});
  for(const id of Object.keys(M.me.pos)){const r=est(id);if(r<0.75)out.push({k:'warn',id,act:'sell',t:`${mkName(id)} is dear: about ${Math.round(100/r)}% of its worth. The Office would sell.`});}
  if(M.me.loan>0.6*mkPosVal(M.me))out.push({k:'bad',t:'The margin loan is close to a call. Pay some of it off, or sell, before the broker does it for you.'});
  O.adv=out;}


/* ================= STAKES AND CONTROL (0.30, stage R3) =================
   A stake in a rival line brings powers, as under the company law of the period: a seat on its board at a fifth, control
   of the board over half, special resolutions (merge it into the Line, or wind it up) at three quarters, and at nine
   tenths the rest can be bought out. A controlled line stays a separate company under its own name and flag: the Line
   sets its dividend and its strategy, can keep it off the Line's trades, end its rate wars and buy its ships at a fair
   price, and takes its profits as dividends. Only the Line's own holding counts, not the investment account's. The
   Combine holds three fifths of each of its members, so no outsider can control one. */
const MK_SEAT=0.2,MK_CTRL=0.5,MK_SPECIAL=0.75,MK_BUYOUT=0.9,MK_ACT1929=ym(1929,10); // the Companies Act 1929: compulsory purchase at nine tenths
const mkLock=id=>(typeof trustMember==='function'&&trustMember(id)?0.6:0)+((S.ex&&S.ex.cos[id]&&S.ex.cos[id].block)?S.ex.cos[id].block.f:0); // the Combine's three fifths, and a friend's blocking stake
const mkStake=id=>{const M=S.ex,c=M&&M.cos[id];return c&&!c.gone?((M.me.pos[id]||{}).n||0)/c.n:0;};
const mkFree=id=>{const c=S.ex.cos[id];return Math.max(0,c.n*(1-mkLock(id))-((S.ex.me.pos[id]||{}).n||0));};
/* 0 none, 1 a seat on the board, 2 control */
const mkInfl=o=>{if(!S.ex||!o)return 0;const k=mkStake(o),c=S.ex.cos[o];return k>=MK_CTRL||(c&&c.proxy&&k>=0.1)?2:k>=MK_SEAT?1:0;}; // a proxy fight won gives control with a tenth
const mkInflOn=rk=>S.ex?mkInfl(topRival(rk)):0;
const MK_DIV={none:{name:'None',pay:0},normal:{name:'Normal',pay:0.5},generous:{name:'Generous',pay:0.9}};
const MK_STRAT={retrench:{name:'Retrench',aggr:0.6},steady:{name:'Steady',aggr:1},expand:{name:'Expand',aggr:1.35}};
/* buy a share of the company outright, from what is on the market */
function mkBuyPct(id,pct){const M=mkEnsure(),c=M.cos[id];if(!c||c.gone||mkShut()||MK_REL_BY[id]||(M.me.short&&M.me.short[id]))return false;
  const q=Math.floor(Math.min(pct*c.n,mkFree(id)));if(q<1)return false;
  const est=q*c.px*(1+MK_FEE_BUY+0.3*q/Math.max(1,mkFree(id)));if(S.cash<est)return false;
  const before=mkStake(id),r=mkDeal(M.me,id,q);if(!r)return false;S.cash+=r.cash;
  news(`Bought ${int(q)} shares in ${mkName(id)}, ${Math.round(q/c.n*1000)/10}% of it, for ${fmt(-r.cash)}.`);mkThresholds(id,before);return true;}
/* crossing a threshold is public: the City reads a bid into it */
function mkThresholds(id,before){const k=mkStake(id),M=S.ex,n=mkName(id);
  if(before<MK_SEAT&&k>=MK_SEAT&&!M.seen['s'+id]){M.seen['s'+id]=1;mkShock(id,1.08);mkOwnPush(id,0,1.08);news(`The Morven Line now holds ${Math.round(k*100)}% of ${n} and takes a seat on its board. The City expects a bid: its shares rise.`,'good',true);}
  if(before<MK_CTRL&&k>=MK_CTRL){const co=S.rivals[id];co.aggr0=co.aggr0||RIVAL_P[id].aggr;news(`The Morven Line controls ${n}: over half its shares. Its board now answers to you (Finance, Shares).`,'good',true);}
  if(before<MK_SPECIAL&&k>=MK_SPECIAL)news(`With ${Math.round(k*100)}% of ${n} the Line can pass special resolutions: merge it into the Line, or wind it up.`,'good');
  if(before<MK_BUYOUT&&k>=MK_BUYOUT)news(`The Line holds ${Math.round(k*100)}% of ${n}. The rest can be bought out${S.m>=MK_ACT1929?' at the market price, under the Companies Act':', by negotiation at a premium'}.`,'good');}
/* each month: a controlled line's strategy, and keeping it off the Line's trades */
function mkControlMonth(){const M=S.ex;
  for(const o of Object.keys(M.cos)){if(MK_REL_BY[o]||M.cos[o].gone||!coAlive(o))continue;const co=S.rivals[o];
    if(mkInfl(o)<2){if(co.aggr0){RIVAL_P[o].aggr=co.aggr0;co.aggr0=null;co.divPol=null;co.keepOff=false;}continue;}
    co.aggr0=co.aggr0||RIVAL_P[o].aggr;RIVAL_P[o].aggr=co.aggr0*MK_STRAT[co.strat||'steady'].aggr;
    if(co.lineLoan>0){const i=co.lineLoan*0.05/12;co.cash-=i;book('shares',i);const spare=co.cash-2*coReserve(o);if(spare>0){const r=Math.min(co.lineLoan,spare);co.cash-=r;co.lineLoan-=r;S.cash+=r;if(co.lineLoan<1){co.lineLoan=0;news(`${mkName(o)} has repaid the Line's loan.`,'good');}}}
    if(co.keepOff)for(const x of coFleet(o)){if(!S.lines[x.route])continue;
      const cr=isCruise(x.route),ok=k=>k!==x.route&&!S.lines[k]&&routeOpen(k,S.m)&&isCruise(k)===cr,own=coFleet(o).map(y=>y.route).filter(ok);
      const to=own[0]||Object.keys(ROUTES).filter(ok).sort((a,b)=>S.rships.filter(y=>y.route===a).length-S.rships.filter(y=>y.route===b).length)[0];
      if(to){rivalMove(o,x.route,'move',x.name,to);x.route=to;RW_CACHE.k=null;}}}}
function mkCtrlSet(o,k,v){if(mkInfl(o)<2)return false;const co=S.rivals[o];
  if(k==='div'&&MK_DIV[v])co.divPol=v;else if(k==='strat'&&MK_STRAT[v])co.strat=v;else if(k==='keep')co.keepOff=!co.keepOff;else return false;return true;}
/* end the rate wars it is fighting */
function mkPeace(o){if(mkInfl(o)<2)return false;let n=0;
  for(const rk of Object.keys(S.wars||{})){const w=S.wars[rk];if((w.by&&w.by.includes(o))||(!w.by&&!w.trust&&topRival(rk)===o)){delete S.wars[rk];S.tension[rk]=20;n++;}}
  if(n)news(`On the Line's instructions ${mkName(o)} ends its rate war${n>1?'s':''}. Fares recover.`,'good');return n>0;}
/* a rival ship becomes the Line's: valued as the rival's books value her, in her old owner's colours */
function mkAdopt(x,o){const age=Math.max(0,yearOfM(S.m)-x.built),fat=clamp(age*1.8,0,95),cond=75;
  const base=Math.round(coShipVal(x)/(PX()*Math.pow(cond/100,0.7)*Math.max(0.15,1-fat*0.0085)*shipMkt()));
  const port=(x.v&&x.v.port)||ROUTES[x.route].calls[0];
  const sh=makeShip({name:S.ships.some(y=>y.name===x.name)?x.name+' II':x.name,built:x.built,grt:x.grt,knots:x.knots,berths:{f:0,s:0,t:0,tt:0,...x.berths},cargo:x.cargo||0,fuel:x.fuel||(x.built>=1925?'oil':'coal'),base,note:`Late of ${mkName(o)}.`},cond,port);
  if(typeof rivalLiv==='function')sh.paint={...rivalLiv(o),name:`${mkName(o)}'s colours`};
  sh.acq=S.m;if(S.lines[x.route]&&routeOpen(x.route,S.m)){sh.line=x.route;sh.state='port';sh.portLeft=2;}
  S.ships.push(sh);dropRival(x);return sh;}
function mkTakeShip(o,sid){if(mkInfl(o)<2)return false;const x=S.rships.find(y=>y.id===sid&&y.owner===o);if(!x)return false;
  const price=Math.round(coShipVal(x)/100)*100;if(S.cash<price)return false;
  S.cash-=price;S.rivals[o].cash+=price;const sh=mkAdopt(x,o);RW_CACHE.k=null;
  news(`SS ${sh.name} passes from ${mkName(o)} to the Morven Line at a fair price, ${fmt(price)}.${sh.line?'':' She lies laid up until you give her a line.'}`,'good');return true;}
/* special resolution: merge. The other shareholders are paid their share of what it is worth; its ships, trades, cash
   and debts become the Line's */
const mkMergeCost=o=>Math.round((1-mkStake(o))*S.ex.cos[o].n*Math.max(mkVal(o),0));
function mkMerge(o){const M=S.ex,c=M.cos[o],co=S.rivals[o];if(!c||c.gone||mkStake(o)<MK_SPECIAL)return false;
  const cost=mkMergeCost(o);if(S.cash+co.cash<cost)return false;
  const n=mkName(o),fleet=coFleet(o),routes=[...new Set(fleet.map(x=>x.route))];let opened=0;
  for(const rk of routes)if(!S.lines[rk]&&routeOpen(rk,S.m)){S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};opened++;}
  for(const x of fleet)mkAdopt(x,o);
  for(const q of (S.rorders||[]).filter(q=>q.o===o))S.cash+=Math.round(coNewPrice(q.sh)*0.8); // orders on the stocks are sold back to the builders
  S.rorders=(S.rorders||[]).filter(q=>q.o!==o);
  const F=M.fund;if(F&&F.pos[o]){F.cash+=F.pos[o].n*Math.max(mkVal(o),0);delete F.pos[o];}
  S.cash+=co.cash-cost;S.debt+=co.debt;delete M.me.pos[o];
  Object.assign(co,{dead:true,deadM:S.m,merged:true,cash:0,debt:0,h:[]});c.gone=S.m;c.px=0;if(co.aggr0)RIVAL_P[o].aggr=co.aggr0;
  S.rmoves.unshift({m:S.m,o,rk:routes[0]||'liv',kind:'merged'});RW_CACHE.k=null;
  news(`${n} is merged into the Morven Line. Its ${fleet.length} ship${fleet.length===1?'':'s'} fly the Line's flag${opened?`, and ${opened} new trade${opened===1?'':'s'} open${opened===1?'s':''}`:''}; its debts become the Line's. The other shareholders are paid ${fmt(cost)}.`,'good',true);return true;}
/* special resolution: wind it up. Its ships are sold, its debts paid, and what is left goes to the shareholders */
const mkWindValue=o=>{const co=S.rivals[o];return co.cash+coFleet(o).reduce((a,x)=>a+0.7*coShipVal(x),0)-co.debt-(co.lineLoan||0);};
/* lend to a controlled line to carry it through a bad patch: 5% a year, repaid when it is flush, lost if it fails */
function mkLend(o,amt){if(mkInfl(o)<2||!(amt>0)||S.cash<amt)return false;const co=S.rivals[o];S.cash-=amt;co.cash+=amt;co.lineLoan=(co.lineLoan||0)+amt;
  news(`The Line lends ${mkName(o)} ${fmt(amt)} at 5%, to be repaid when it can.`);return true;}
function mkWindUp(o){const M=S.ex,c=M.cos[o],co=S.rivals[o];if(!c||c.gone||mkStake(o)<MK_SPECIAL)return false;
  const loan=Math.min(co.lineLoan||0,Math.max(0,mkWindValue(o)+(co.lineLoan||0)));if(loan>0){S.cash+=loan;co.lineLoan=0;}
  const net=Math.max(0,mkWindValue(o)),perSh=net/c.n,k=mkStake(o),n=mkName(o),fleet=coFleet(o),routes=[...new Set(fleet.map(x=>x.route))];
  for(const x of fleet)dropRival(x);S.rorders=(S.rorders||[]).filter(q=>q.o!==o);
  const h=M.me.pos[o],got=h.n*perSh;S.cash+=h.cost;book('shares',got-h.cost);delete M.me.pos[o]; // the proceeds, with the gain or loss on what the shares cost through the books
  const F=M.fund;if(F&&F.pos[o]){F.cash+=F.pos[o].n*perSh;delete F.pos[o];}
  Object.assign(co,{dead:true,deadM:S.m,wound:true,cash:0,debt:0,h:[]});c.gone=S.m;c.px=0;if(co.aggr0)RIVAL_P[o].aggr=co.aggr0;
  S.rmoves.unshift({m:S.m,o,rk:routes[0]||'liv',kind:'fail'});RW_CACHE.k=null;
  S.coQueue=S.coQueue||[];S.coQueue.push({at:S.m+6+Math.floor(mrand()*9),kind:RIVAL_P[o].kind||'liner',routes,flag:RIVALS[o].flag});
  news(`${n} is wound up on the Line's resolution. Its ${fleet.length} ships are sold and its debts paid; the Line's ${Math.round(k*100)}% brings ${fmt(got)}.`,'good',true);return true;}
/* at nine tenths: the rest bought out, at the market under the 1929 Act, before it at a quarter over */
const mkBuyoutCost=o=>{const c=S.ex.cos[o];return Math.round((c.n-((S.ex.me.pos[o]||{}).n||0))*c.px*(S.m>=MK_ACT1929?1:1.25));};
function mkBuyout(o){const M=S.ex,c=M.cos[o];if(!c||c.gone||mkStake(o)<MK_BUYOUT)return false;const cost=mkBuyoutCost(o);if(S.cash<cost)return false;
  const h=M.me.pos[o],rest=c.n-h.n;S.cash-=cost;h.n=c.n;h.cost+=cost;const F=M.fund;if(F&&F.pos[o]){F.cash+=F.pos[o].n*c.px*(S.m>=MK_ACT1929?1:1.25);delete F.pos[o];}
  news(`The Line buys the last ${int(rest)} shares in ${mkName(o)} for ${fmt(cost)}. It is wholly owned.`,'good');return true;}

/* a line's stake panel, under its card on the Shares view */
function stakeHTML(o){const M=S.ex,c=M.cos[o],co=S.rivals[o],k=mkStake(o),inf=mkInfl(o),shut=mkShut(),lock=mkLock(o),n=mkName(o);
  const cost=p=>Math.round(Math.min(p*c.n,mkFree(o))*c.px*(1+MK_FEE_BUY+0.3*p));
  const step=(t,lbl,on)=>`<li class="${on?'pos':''}">${on?'✓ ':''}${Math.round(t*100)}%: ${lbl}</li>`;
  let h=`<div class="ctl"><span class="lbl">The Line's stake: ${Math.round(k*1000)/10}%${k>0?` (${int(M.me.pos[o].n)} shares)`:''}</span>
    <ul class="note" style="padding-left:18px;margin:0">${step(MK_SEAT,'a seat on the board: on a trade it leads it pushes less hard on your fares, and leads fewer rate wars against you',k>=MK_SEAT)}
      ${step(MK_CTRL,'control: set its dividend and strategy, keep it off your trades, end its rate wars, buy its ships at a fair price',k>=MK_CTRL)}
      ${step(MK_SPECIAL,'special resolutions: merge it into the Line, or wind it up',k>=MK_SPECIAL)}
      ${step(MK_BUYOUT,`buy out the rest${S.m>=MK_ACT1929?' at the market, under the Companies Act':', by negotiation at a quarter over the market'}`,k>=MK_BUYOUT)}</ul>
    ${lock?`<p class="note">The Combine holds ${Math.round(lock*100)}% and will not sell: the Line can hold no more than ${Math.round((1-lock)*100)}%.</p>`:''}
    <div class="btns">${[0.01,0.05,0.1].filter(p=>mkFree(o)>=1).map(p=>`<button class="btn" data-act="mkpct" data-d='${JSON.stringify([o,p])}' ${shut||S.cash<cost(p)||S.over?'disabled':''}>Buy ${Math.round(p*100)}% · ${fmt(cost(p))}</button>`).join('')}</div>
    <p class="note">Big purchases move the price: the more of what is left on the market you buy, the more it costs. Crossing a fifth is noticed in the City.</p></div>`;
  if(inf===2){const wars=Object.keys(S.wars||{}).filter(rk=>{const w=S.wars[rk];return (w.by&&w.by.includes(o))||(!w.by&&!w.trust&&topRival(rk)===o);});
    const ships=coFleet(o).sort((a,b)=>b.built-a.built);
    h+=`<div class="ctl"><span class="lbl">Its board, under your control</span>
      <div class="ctl"><span class="lbl">Dividend</span><div class="seg" role="group">${Object.keys(MK_DIV).map(v=>`<button data-act="ctrlset" data-d='${JSON.stringify([o,'div',v])}' aria-pressed="${(co.divPol||'normal')===v}">${MK_DIV[v].name}</button>`).join('')}</div>
        <p class="note">Paid each January from last year's profit: ${Math.round(MK_DIV[co.divPol||'normal'].pay*100)}% of it, while it keeps two reserves in hand. The Line gets its ${Math.round(k*100)}%.</p></div>
      <div class="ctl"><span class="lbl">Strategy</span><div class="seg" role="group">${Object.keys(MK_STRAT).map(v=>`<button data-act="ctrlset" data-d='${JSON.stringify([o,'strat',v])}' aria-pressed="${(co.strat||'steady')===v}">${MK_STRAT[v].name}</button>`).join('')}</div>
        <p class="note">How hard it grows, fights for trade and cuts fares.</p></div>
      <button class="btn" data-act="ctrlset" data-d='${JSON.stringify([o,'keep',1])}' aria-pressed="${!!co.keepOff}">${co.keepOff?'✓ Keeping off your trades':'Keep it off your trades'}</button>
      ${wars.length?`<button class="btn" data-act="ctrlpeace" data-id="${o}">End its rate war${wars.length>1?'s':''} on ${wars.map(rk=>ROUTES[rk].name).join(', ')}</button>`:''}
      <details class="thist"><summary>Buy its ships at a fair price (${ships.length})</summary><div class="stack" style="margin-top:6px">${ships.map(x=>{const pr=Math.round(coShipVal(x)/100)*100;
        return `<div class="uprow"><div><strong>SS ${esc(x.name)}</strong><div class="meta">Built ${x.built} · ${int(x.grt)} grt · ${x.knots} knots · ${ROUTES[x.route].name}</div></div><button class="btn" data-act="ctrlship" data-d='${JSON.stringify([o,x.id])}' ${S.cash<pr||S.over?'disabled':''}>Buy · ${fmt(pr)}</button></div>`;}).join('')}</div></details>
      <div class="ctl"><span class="lbl">Support it</span><div class="btns">${[10000,50000].map(v=>Math.round(v*PX()/1000)*1000).map(v=>`<button class="btn" data-act="mklend" data-d='${JSON.stringify([o,v])}' ${S.cash<v||S.over?'disabled':''}>Lend ${fmt(v)}</button>`).join('')}</div>
        <p class="note">${co.lineLoan>0?`It owes the Line ${fmt(co.lineLoan)}. `:''}A loan at 5% carries it through a bad patch; it repays when it has cash to spare, and the loan is lost if it fails anyway.</p></div>
      <p class="note">It stays a company of its own, under its own name and flag; its profits reach the Line only as dividends.</p></div>`;}
  if(k>=MK_SPECIAL){const mc=mkMergeCost(o),wv=Math.max(0,mkWindValue(o))*k;
    h+=`<div class="ctl"><span class="lbl">Special resolutions</span>
      <p class="note">Merge: its ${coFleet(o).length} ships, its trades, its ${fmt(co.cash)} in cash and ${fmt(co.debt)} of debt become the Line's; the other shareholders are paid ${fmt(mc)} for their share of what it is worth. Wind up: its ships are sold and its debts paid; the Line's share of what is left is about ${fmt(wv)}.</p>
      <div class="btns"><button class="btn primary" data-act="mkmerge" data-id="${o}" ${S.cash+co.cash<mc||S.over?'disabled':''}>${UI.confirm==='mkmerge'+o?'Confirm the merger':`Merge it into the Line${mc?' · '+fmt(mc):''}`}</button>
        <button class="btn danger" data-act="mkwind" data-id="${o}" ${S.over?'disabled':''}>${UI.confirm==='mkwind'+o?'Confirm: wind it up':'Wind it up'}</button></div></div>`;}
  if(k>=MK_BUYOUT&&k<1){const bc=mkBuyoutCost(o);h+=`<button class="btn" data-act="mkbuyout" data-id="${o}" ${S.cash<bc||S.over?'disabled':''}>Buy out the rest · ${fmt(bc)}</button>`;}
  return h;}
/* ---------- the Market tab ---------- */
const pxTxt=p=>{if(!(p>0))return '–';let L=Math.floor(p),s=Math.floor((p-L)*20),d=Math.round(((p-L)*20-s)*12);if(d===12){d=0;s++;}if(s===20){s=0;L++;}
  if(L&&!s&&!d)return `£${L}`;return (L?`£${L} `:'')+`${s}s`+(d?` ${d}d`:'');};
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
  const live=Object.keys(M.cos).filter(id=>!M.cos[id].gone&&id!=='morven').sort((a,b)=>(MK_REL_BY[a]?1:0)-(MK_REL_BY[b]?1:0)||mkCap(b)-mkCap(a));
  const I=M.idx[M.idx.length-1];
  const head=`<section class="sec"><h2>The Stock Exchange</h2>
    <p class="${M.mood<0.8?'badline':M.mood>1.2?'warnline':'note'}">${shut?'The Stock Exchange is closed for the war. Dealing resumes in January 1915.':`The market is ${moodWord(M.mood)}.${I?` Shipping shares stand at ${Math.round(I[1])} (${Math.round(I[1]/Math.max(1,I[2])*100)}% of what the lines are worth).`:''}`}</p>
    ${mkIdxChart()}
    <p class="note">You never have to deal here. Prices follow what each company owns and earns, the news and the mood of the City. Buying costs 1% (commission and stamp duty), selling 0.5%, and a big order moves the price against you.</p></section>`;
  const pv=mkPosVal(A),held=Object.keys(A.pos);
  const mine=`<section class="sec"><h2>The Line's shares</h2>
    ${held.length?`<div class="tablewrap"><table class="mkt"><tr><th>Company</th><th class="r">Shares</th><th class="r">Price</th><th class="r">Value</th><th class="r">Gain</th></tr>
      ${held.map(id=>{const h=A.pos[id],c=M.cos[id],fp=mkFair(id),v=h.n*fp,pushed=Math.abs(fp/c.px-1)>0.02;return `<tr data-act="mksel" data-id="${id}"><td>${esc(mkName(id))}</td><td class="r num">${int(h.n)}</td><td class="r num">${pxTxt(c.px)}${pushed?`<div class="meta">${pxTxt(fp)} without your ${fp<c.px?'buying':'selling'}</div>`:''}</td><td class="r num">${fmt(v)}</td><td class="r num ${v>=h.cost?'pos':'neg'}">${fmt(v-h.cost)}</td></tr>`;}).join('')}</table></div>`:'<p class="note">None. Pick a company below to buy.</p>'}
    ${held.some(id=>Math.abs(mkFair(id)/M.cos[id].px-1)>0.02)?'<p class="note">Your own dealing has moved some of these prices, and the City reads a bid into a big stake. The Line values its shares without that push, which fades over a few months: that is what they would fetch once the excitement is over.</p>':''}
    <dl class="kv"><dt>Shares, valued</dt><dd>${fmt(pv)}</dd><dt>Broker's loan (margin)</dt><dd>${fmt(A.loan)}</dd>${A.loan>0?`<dt>Interest</dt><dd>${fmt(A.loan*MK_LOAN_RATE/12)}/mo</dd><dt>Loan to value</dt><dd>${Math.round(A.loan/Math.max(1,pv)*100)}%</dd>`:''}</dl>
    ${M.call?`<p class="badline">Margin call: pay in ${fmt(M.call.amt)} or sell by ${monthName(M.call.due)}.</p>`:''}
    ${A.loan>0?`<div class="btns">${[...amts,A.loan].filter((v,i,a)=>v<=A.loan&&a.indexOf(v)===i).map(v=>`<button class="btn" data-act="mkrepay" data-id="${Math.round(v)}" ${S.cash<v||S.over?'disabled':''}>Repay ${v===A.loan?'all':fmt(v)}</button>`).join('')}</div>`:''}</section>`;
  const rows=live.map(id=>{const c=M.cos[id],h=c.hist,chg=h.length>1?c.px/h[h.length-2]-1:0,yld=(c.dy||0)/c.px,val=mkVal(id);
    return `<tr data-act="mksel" data-id="${id}"${sel===id?' aria-selected="true" class="cur"':''}><td><strong>${esc(mkName(id))}</strong><div class="meta">${mkKind(id)}${!MK_REL_BY[id]&&RIVALS[id]?' · '+esc(RIVALS[id].flag.split(',')[0]):''}</div></td>
      <td class="r num">${pxTxt(c.px)}</td><td class="r num ${chg>=0?'pos':'neg'}">${pctS(chg)}</td><td class="r num">${yld>0?(yld*100).toFixed(1)+'%':'–'}</td><td class="r num">${O?Math.round(c.px/Math.max(1e-6,val)*100)+'%':'–'}</td><td class="r num">${A.pos[id]?int(A.pos[id].n):''}</td></tr>`;}).join('');
  let detail='';
  if(sel&&M.cos[sel]&&!M.cos[sel].gone){const c=M.cos[sel],h=A.pos[sel];
    detail=`<div class="card"><div class="row"><strong>${esc(mkName(sel))}</strong><span class="num">${pxTxt(c.px)}</span></div>
      <div class="meta">${mkKind(sel)} · ${int(c.n)} shares · worth ${fmt(mkCap(sel))} at the market${!MK_REL_BY[sel]&&S.rivals[sel]?` · ${coFleet(sel).length} ships, ${coHealth(sel)[0].toLowerCase()}`:''} · dividend ${c.dy>0?pxTxt(c.dy)+' a share a year':'none'}</div>
      ${mkSpark(c.hist.slice(-60))}<p class="note">Five years of prices.</p>
      <div class="btns">${amts.map(v=>`<button class="btn" data-act="mkbuy" data-d='${JSON.stringify([sel,v,0])}' ${shut||S.cash<v||S.over?'disabled':''}>Buy ${fmt(v)}</button>`).join('')}</div>
      <div class="btns">${amts.map(v=>`<button class="btn" data-act="mkbuy" data-d='${JSON.stringify([sel,v,1])}' ${shut||S.cash<v*(1-MK_MARGIN)||S.over?'disabled':''}>Buy ${fmt(v)} on margin</button>`).join('')}</div>
      ${h?`<div class="btns"><button class="btn" data-act="mksell" data-d='${JSON.stringify([sel,0.5])}' ${shut||S.over?'disabled':''}>Sell half</button><button class="btn" data-act="mksell" data-d='${JSON.stringify([sel,1])}' ${shut||S.over?'disabled':''}>Sell all ${int(h.n)}</button></div>`:''}
      ${MK_REL_BY[sel]?'':stakeHTML(sel)}${typeof movesHTML==='function'?movesHTML(sel):''}
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
      ${(O.cands||[]).length?`<details class="thist"><summary>Candidates for its head this quarter</summary><div class="stack" style="margin-top:6px">${O.cands.map((h,i)=>`<div class="uprow"><div><strong>${esc(h.name)}</strong><div class="meta">${compWord(h.comp)} · ${fmt(h.wage)} a month</div></div><button class="btn" data-act="officehire" data-id="${i}" ${S.cash<O.head.wage*3||S.over?'disabled':''}>Appoint · ${fmt(O.head.wage*3)} to let ${esc(O.head.name)} go</button></div>`).join('')}</div></details>`:''}
      <button class="btn quiet" data-act="officeclose">${UI.confirm==='officeclose'?'Confirm: close the Office':'Close the Office'}</button>`
    :`<p class="note">A department of your own, instead of a broker: ${fmt(oc)} to set up and about ${fmt(Math.round((65*PX()+3*CLERK_WAGE+50*PX())))} a month and up, by its head. It advises on every company and can run the investment account itself. A good head beats a broker; a poor one does worse.</p>
      <button class="btn" data-act="officeopen" ${S.cash<oc||S.over?'disabled':''}>Open the Investment Office · ${fmt(oc)}</button>`}</section>`;
  return (typeof flHTML==='function'?flHTML():'')+head+mine+list+fund+office;
}
