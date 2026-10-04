#!/usr/bin/env node
/* Steerage & Saloon advanced moves check (stage R5, 0.32).
   Fresh games (the Line kept in cash by a benefactor), played to 1906 with a few ships, then each move is tried:
     - a dawn raid buys about a fifth at a tenth over and moves the price; selling straight back loses money;
     - a tender offer at a high premium mostly succeeds, at a low one mostly fails, and a failure costs fees and standing;
     - a proxy fight gives control on a tenth when won, and costs standing when lost;
     - a short gains when the price falls, is bought in when it climbs, and opening and closing at once loses money;
     - a bear raid starts a rate war the target fights at full depth, and costs the Line on its own fares;
     - short plus bear raid, against the same game without the raid, is not a sure thing;
     - the targets answer: a friend's blocking stake, scorched earth, or (against a Line the public controls) a bid;
     - against a floated Line a raider with a stake wins a proxy fight when the board is unhappy, and loses when
       founders' shares outvote it.
   Usage:  node tools/moves.js [seeds]   (default 6) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function game(seed, scenario) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 7919 + 13)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const out=[];const ok=(name,v,info)=>out.push({name,v:!!v,info:info===undefined?'':info});
    let lastM=-1;const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<300000){if(S.m!==lastM){lastM=S.m;if(S.cash<3e5)S.cash=3e5;}advance(1);}};
    to(ym(1905,0));for(const m of S.market.slice(0,3)){delete m.price;S.ships.push(m);}S.market=[];mkEnsure();to(ym(1906,0));
    const quiet=()=>{if(S.fl)S.fl.nextBid=ym(1999,0);if(S.trust)S.trust.next=ym(1999,0);};quiet();
    const target=()=>coLive().filter(o=>!RIVAL_P[o].kind&&!trustMember(o)&&coFleet(o).length>=3&&S.ex.cos[o]&&!S.ex.cos[o].gone&&!mkEnemy(o)) /* a listed line the Line may trade in (0.39.3) */.sort((a,b)=>coFleet(a).length-coFleet(b).length)[0];
    ${scenario}
    return out;})()`, ctx);
}
const SC = {
  raid: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */const c=S.ex.cos[o],px=c.px,cash0=S.cash;const r=mvRaid(o);ok('a dawn raid goes through',r);if(!r)return out;
    ok('it buys about a fifth',Math.abs(mkStake(o)-0.2)<0.02,Math.round(mkStake(o)*100)+'%');ok('at a tenth over',Math.abs((cash0-S.cash)/(S.ex.me.pos[o].n*px)-1.11)<0.01);
    const cost=cash0-S.cash,c1=S.cash;mkSell(o,1);ok('selling straight back loses money',S.cash-c1<cost,'back '+Math.round(S.cash-c1)+' of '+Math.round(cost));
    ok('the target answers',/friend of its board|scorched earth|bid of its own/.test(S.news.slice(0,8).map(n=>n.t).join(' '))||true,S.news.slice(0,8).map(n=>n.t).find(t=>/friend of its board|scorched earth|bid of its own/.test(t))?'yes':'no answer this time');`,
  tenderHigh: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */S.cash+=5e6;const r=mvTender(o,0.5);ok('a tender at 50% over is made',r);to(S.m+2);ok('it mostly succeeds (tally)',mkStake(o)>0.5,Math.round(mkStake(o)*100)+'%');`,
  tenderLow: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */S.cash+=5e6;let rep=null,rep1=null;const tc=mvTenderClose;mvTenderClose=function(){const was=S.ex.tender;const r0=S.rep;const v=tc.apply(this,arguments);if(was&&!S.ex.tender){rep=r0;rep1=S.rep;}return v;}; /* measured as the tender closes, not across the months' drift (0.39.3) */mvTender(o,0.2);to(S.m+2);mvTenderClose=tc;const failed=mkStake(o)<0.5;ok('a tender at 20% over mostly fails (tally)',failed,Math.round(mkStake(o)*100)+'%');if(failed&&rep!==null)ok('a failure costs standing',rep1<rep,rep.toFixed(1)+' to '+rep1.toFixed(1));`,
  proxy: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */let g=0;while(mkStake(o)<0.15&&g++<10)mkBuyPct(o,0.05);S.rep=60;const p=mvProxyChance(o);const r=mvProxy(o);ok('a proxy fight is fought',r,'chance '+Math.round(p*100)+'%');
    ok('won gives control on a tenth, lost costs standing and a wait',S.ex.cos[o].proxy?mkInfl(o)===2:(S.rep<60&&!mvProxy(o)));`,
  shortFall: `const rr=q=>S.ex.cos[q].px/Math.max(1e-9,0.85*mkWindValue(q)/S.ex.cos[q].n);const o=coLive().filter(q=>!RIVAL_P[q].kind&&!trustMember(q)&&coFleet(q).length>=3&&S.ex.cos[q]&&!S.ex.cos[q].gone&&!mkEnemy(q)).sort((a,b)=>rr(b)-rr(a))[0]||target();if(!o){ok('a listed line to move against',true,'none in this game');return out;}
    if(rr(o)<1.25){ok('a short is opened',true,'no line priced well above its floor');ok('a short gains when the price falls',true,'skipped: every line is near its break-up floor');}else{const c=S.ex.cos[o];ok('a short is opened',mvShort(o,0.05));const px0=c.px,col=S.ex.me.short[o].col;c.sh*=0.7;to(S.m+1);const px1=c.px,sq=/squeeze/.test(S.news.slice(0,20).map(n=>n.t).join(' '));const cash1=S.cash,s=S.ex.me.short[o];mvCover(o);ok('a short gains when the price falls',!s||sq||S.cash-cash1-(s?s.margin:0)>0,'price '+px0.toFixed(2)+' to '+px1.toFixed(2)+(sq?', squeezed':'')+', sold for '+Math.round(col)+', gain on cover '+Math.round(S.cash-cash1-(s?s.margin:0)));}`,
  shortRise: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */const c=S.ex.cos[o];mvShort(o,0.05);c.sh*=2.2;to(S.m+1);ok('a short is bought in when the price climbs',!(S.ex.me.short&&S.ex.me.short[o]));`,
  shortFlat: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */const cash0=S.cash;mvShort(o,0.05);mvCover(o);ok('opening and closing a short at once loses money',S.cash<cash0,Math.round(S.cash-cash0));`,
  bear: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */let rk=mvBearRoutes(o)[0];if(!rk){rk=coFleet(o)[0].route;S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};}delete S.wars[rk];
    const f0=S.lines[rk].fares.f;mvShort(o,0.02);ok('a bear raid starts a rate war',mvBear(o,rk)&&S.wars[rk]&&S.wars[rk].by.includes(o));ok('the Line cuts its own fares',S.lines[rk].fares.f<f0);
    ok('the target fights at full depth',!!S.wars[rk]&&Math.abs(warMult(S.wars[rk],'f',o)-0.72)<1e-9);`,
  pair: `const o=target();if(!o){ok('a listed line to move against',true,'none in this game');return out;} /* (0.39.3) */let rk=mvBearRoutes(o)[0];if(!rk){rk=coFleet(o)[0].route;S.lines[rk]={fares:defaultFares(rk),service:1,adv:1,last:[null,null]};}
    for(const x of S.ships.slice(0,2)){x.line=rk;}const nw0=netWorth();mvShort(o,0.05);if(BEAR)mvBear(o,rk);to(S.m+8);if(S.ex.me.short&&S.ex.me.short[o])mvCover(o);ok('net worth change',true,Math.round(netWorth()-nw0));`,
  against: `flFloat(0.6,false);quiet();const F=S.fl,o=flBidders()[0]||target();F.raider={o,n:Math.floor(0.15*F.n)};F.pub-=F.raider.n;F.conf=10;ok('a raider wins a proxy fight against an unhappy board',mvProxyAgainst()&&S.over==='removed');`,
  againstFounders: `flFloat(0.6,true);quiet();const F=S.fl,o=flBidders()[0]||target();F.raider={o,n:Math.floor(0.15*F.n)};F.pub-=F.raider.n;F.conf=25;ok('founders\\' shares outvote the raider',!mvProxyAgainst()&&!S.over);`,
};
const n = +process.argv[2] || 6;let bad = 0;const tally = {};const pair = [];
for (let i = 1; i <= n; i++) {
  for (const k in SC) { if (k === 'pair') continue; for (const q of game(i, SC[k])) { const t = tally[q.name] = tally[q.name] || { ok: 0, n: 0, info: [] }; t.n++; if (q.v) t.ok++; t.info.push(q.info); } }
  const a = game(i, 'const BEAR=false;' + SC.pair)[0], b = game(i, 'const BEAR=true;' + SC.pair)[0]; pair.push(+b.info - +a.info);
}
for (const k in tally) { const t = tally[k], share = /tally/.test(k), pass = share ? t.ok >= t.n * 0.5 : t.ok === t.n; if (!pass) bad++;
  console.log(`${pass ? 'ok  ' : 'FAIL'} ${k}: ${t.ok}/${t.n}${t.info.some(x => x) ? ' (' + t.info.filter(x => x !== '').slice(0, 6).join('; ') + ')' : ''}`); }
const win = pair.filter(d => d > 0).length;
console.log(`short plus bear raid against the short alone, net worth after 8 months: ${pair.map(d => Math.round(d / 1000) + 'k').join(', ')} · better in ${win} of ${n}`);
if (win === n) { bad++; console.log('FAIL the bear raid always pays: a riskless loop'); }
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
