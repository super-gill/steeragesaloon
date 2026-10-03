#!/usr/bin/env node
/* Steerage & Saloon war profit check (0.37.1). Keeps a fleet of freight-led ships (cargo at least 45% of tonnage) trading from 1911 to 1921 in each
   seed (the cash topped up so nothing is sold or seized; requisition, losses and the duty run as in play) and measures,
   for the ships still trading, what one earns a month in each year against 1913, in the money of the day:
     - in 1916, before the Ministry of Shipping's control, 60% to 200% a year on her 1913 worth for a freight-led ship (0.38.0;
       tramp owners commonly cleared their ships' cost in a year or two; liner and tramp freights
       climbed four to nine times on 1913 while prices rose about 1.7 times; liner rates were held lower than tramp);
     - 1917 and 1918, under control and with most ships requisitioned, lower than 1916 but in profit; 1919 and 1920 paying;
   and that Excess Profits Duty is charged in the war and on gains from selling ships in the 1919-20 boom.
   Usage:  node tools/warprofit.js [seeds]   (default 4) */
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const FILES = ['chart-data', 'data', 'helpers', 'economy', 'lanes', 'wireless', 'silent', 'emergency', 'disaster', 'livery', 'war', 'ledger', 'sim', 'rivals', 'companies', 'outside', 'trust', 'prewar', 'market', 'float', 'moves', 'yard', 'naval', 'facilities', 'crew', 'state', 'clock', 'advice']
  .map(f => path.join(ROOT, 'js', f + '.js')).filter(f => fs.existsSync(f));
const SRC = FILES.map(f => [f, fs.readFileSync(f, 'utf8')]);
const RNG = `Math.random=(function(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};})(SEED);`;
function run(seed) {
  const ctx = { console, performance: { now: () => 0 }, localStorage: { getItem() { return null; }, setItem() {} } };
  vm.createContext(ctx);
  vm.runInContext(RNG.replace('SEED', String(seed * 6007 + 29)), ctx);
  for (const [f, s] of SRC) vm.runInContext(s, ctx, { filename: f });
  return vm.runInContext(`(function(){
    newGame();UI.autoPause=false;UI.speed=1;const lines=['liv','lha','waf','rpl','ban','hal'];
    for(const k of lines)S.lines[k]=S.lines[k]||{fares:defaultFares(k),service:1,adv:1,last:[null,null]};
    const to=m=>{let g=0;while(!S.over&&S.m<m&&g++<100000){if(S.cash<5e5)S.cash=5e5;if(S.dis)S.dis.show=false;if(S.war)S.war.show=false;advance(1);}};
    to(ym(1910,0));let g=0;
    while(S.ships.length<10&&g++<60){refreshMarket();const m=S.market.shift();if(!m)break;if((m.cargo||0)<m.grt*0.45)continue; // freight-led ships: the war and the boom were a freight market (0.38.0; 0.3 before let the fleet drawn decide the result)delete m.price;
      let b=null;for(const rk of lines){if(!routeOpen(rk,S.m))continue;const q=econYear(m,rk).pm;if(!b||q>b.pm)b={rk,pm:q};}
      m.line=b?b.rk:'liv';if(m.state==='laid'){m.state='port';m.portLeft=1;}m.autoDock=55;S.ships.push(m);}
    const per={},epd={},cat={},sum={};let v13=0,sold=null,soldTaxed=false;let news0=new Set(S.news);
    for(let y=1911;y<=1920;y++){const tot=[0,0];if(y===1913)v13=S.ships.reduce((a,x)=>a+shipValue(x),0)/S.ships.length;const C=cat[y]={};
      for(let i=0;i<12;i++){if(y===1920&&i===2){const x=S.ships.find(q=>q.state==='port'||q.state==='sea');if(x){const v=saleValue(x);exitShip(x,'sell');sold={v,g:((S.war.gain||{})[1920])||0};}}to(ym(y,i)+1);for(const x of S.ships){if(x.state==='req'||x.state==='lost'||x.state==='laid'||!x.line)continue;const v=(x.pl||[]).slice(-1)[0];if(v===undefined)continue;tot[0]+=v;tot[1]++;const c=(x.plc||[]).slice(-1)[0]||{};for(const q in c)C[q]=(C[q]||0)+c[q]/1;C._n=(C._n||0)+1;}
        if(y>=1914&&y<=1916)for(const x of S.ships)if(!x.wcSave&&x.state==='port'&&x.berths.t>200)warCargoOn(x);
        if(y>=1919)for(const x of S.ships)if(x.wcSave&&x.state==='port')warCargoOff(x);
        for(const q of S.news){if(news0.has(q))continue;news0.add(q);const t=q.t||String(q);if(/^Excess Profits Duty on 1920/.test(t)&&/on ships sold/.test(t))soldTaxed=true;if(/^Excess Profits Duty on/.test(t)){const yy=+t.match(/on (\\d{4})/)[1];const a=t.match(/excess, £([\\d,]+)/);epd[yy]=a?+a[1].replace(/,/g,''):0;}}}
      per[y]=tot[1]?tot[0]/tot[1]:null;sum[y]=tot;}
    to(ym(1921,1));for(const q of S.news){if(news0.has(q))continue;const t=q.t||String(q);if(/^Excess Profits Duty on 1920/.test(t)&&/on ships sold/.test(t))soldTaxed=true;if(/^Excess Profits Duty on/.test(t)){const yy=+t.match(/on (\\d{4})/)[1];const a=t.match(/excess, £([\\d,]+)/);epd[yy]=a?+a[1].replace(/,/g,''):0;}}
    return {per,epd,cat,sum,v13,sold,soldTaxed,annual:S.annual};})()`, ctx);
}
const n = +process.argv[2] || 4, R = [];
for (let i = 1; i <= n; i++) R.push(run(i));
const med = a => { const s = a.filter(v => v !== null && isFinite(v)).sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
// pooled over all seeds: the year's takings less costs over the ship-months traded, against 1913's
const pool = y => { let a = 0, b = 0; for (const r of R) { a += r.sum[y][0]; b += r.sum[y][1]; } return b ? a / b : NaN; };
const v13 = R.reduce((a, r) => a + r.v13, 0) / R.length, roc = y => 12 * pool(y) / v13;
const ratio = y => pool(y) / pool(1913);
const k = v => '£' + Math.round(v).toLocaleString('en-GB');
console.log('a trading ship\'s month, pooled over seeds: ' + [1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919, 1920].map(y => `${y} ${k(pool(y))}`).join(' · '));
console.log('a year\'s profit on a ship\'s 1913 worth (' + k(v13) + '): ' + [1911, 1912, 1913, 1914, 1915, 1916, 1917, 1918, 1919, 1920].map(y => `${y} ${Math.round(roc(y) * 100)}%`).join(' · '));
console.log('ship-months traded: ' + [1913, 1915, 1916, 1917, 1918, 1919, 1920].map(y => y + ' ' + R.reduce((a, r) => a + r.sum[y][1], 0)).join(' · '));
console.log('duty paid, median: ' + [1914, 1915, 1916, 1917, 1918, 1919, 1920].map(y => `${y} ${k(med(R.map(r => r.epd[y] || 0)))}`).join(' · '));
if (process.env.V) for (const y of [1913, 1916, 1917, 1918, 1919, 1920]) { const C = R[0].cat[y], n = C._n || 1; console.log(y, Object.entries(C).filter(([q]) => q !== '_n').map(([q, v]) => q + ' ' + Math.round(v / n)).join(' · ')); }
let bad = 0; const ok = (name, v, info) => { if (!v) bad++; console.log(`${v ? 'ok  ' : 'FAIL'} ${name}${info ? ' (' + info + ')' : ''}`); };
const w = roc(1916), c = (() => { let a = 0, b = 0; for (const r of R) for (const y of [1917, 1918]) { a += r.sum[y][0]; b += r.sum[y][1]; } return b ? 12 * a / b / v13 : NaN; })(); // pooled: few ships are left trading
ok('1916: a freight-led ship returns 60% to 200% a year on her 1913 worth', w >= 0.6 && w <= 2, Math.round(w * 100) + '%');
ok('1917-18 together: under control, below 1916 and still in profit', c < w && c > 0, Math.round(c * 100) + '%');
ok('1919-20: the boom pays', roc(1919) > 0.05 && roc(1920) > 0.05, Math.round(roc(1919) * 100) + '%, ' + Math.round(roc(1920) * 100) + '%');
ok('the duty is charged in at least two of its years (1915 to 1920; the test tops up the cash, which raises the standard)', R.filter(r => [1915, 1916, 1917, 1918, 1919, 1920].filter(y => r.epd[y] > 0).length >= 2).length >= Math.ceil(n * 0.75), R.map(r => [1915, 1916, 1917, 1918, 1919, 1920].filter(y => r.epd[y] > 0).length).join(','));
ok('a ship sold in the 1920 boom counts as profit for the duty', R.filter(r => r.sold).every(r => r.sold.g > 0) && R.filter(r => r.soldTaxed).length >= R.filter(r => r.sold).length / 2, R.map(r => r.sold ? k(r.sold.g) + ' of ' + k(r.sold.v) : 'none').join(', '));
console.log(bad ? `CHECK: ${bad} failed` : 'PASS');
