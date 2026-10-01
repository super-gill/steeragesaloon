/* ================= CLOCK ================= */
function advance(days){
  while(days>1e-9&&!S.over&&UI.speed>0){
    const next=Math.floor(S.t+1e-9)+1,due=S.dis&&S.dis.state==='armed'&&S.dis.t0>S.t+1e-9?S.dis.t0:next; // stop on the minute of the 1912 strike
    const step=Math.min(days,next-S.t,due-S.t);
    moveAll(step);S.t+=step;days-=step;
    if(S.t>=next-1e-9){S.t=next;dailyTick();UI.dirty=true;}
  }
}
let lastT=performance.now();
/* the frame-time readout (Menu, Settings): per second, frames, and the milliseconds a frame spends on each part (0.36.0) */
const PERF={t0:0,n:0,sim:0,adv:0,draw:0,map:0,worst:0};
function perfShow(t){const P=PERF;if(!P.t0)P.t0=t;if(t-P.t0<1000)return;
  let h=document.getElementById('perfHud');if(!h){h=document.createElement('div');h.id='perfHud';h.className='perfhud';const m=document.getElementById('map');(m||document.body).appendChild(h);}
  const f=k=>(P[k]/Math.max(1,P.n)).toFixed(1);
  h.textContent=`${Math.round(P.n*1000/(t-P.t0))} fps · simulation ${f('sim')} ms · advice ${f('adv')} · screen ${f('draw')} · chart ${f('map')} · slowest frame ${Math.round(P.worst)} ms · ${S?S.ships.length:0} ships`;
  Object.assign(P,{t0:t,n:0,sim:0,adv:0,draw:0,map:0,worst:0});}
function frame(t){
  const dt=Math.min(0.1,(t-lastT)/1000),gap=t-lastT;lastT=t;const on=UI.perf,now=()=>on?performance.now():0;let q=now();
  if(UI.slow&&t>UI.slow.until){UI.slow=null;UI.dirty=true;}
  if(S&&!S.over&&UI.speed>0){const er=emClock();let r=SPEEDS[UI.speed];if(er&&!UI.emNormal)r=Math.min(er,r);if(UI.slow)r=Math.min(UI.slow.rate,r);try{advance(dt*r);}catch(e){UI.speed=0;if(typeof reportFault==='function')reportFault('simulation (the clock is paused)',e);}
    if(er&&!UI.dirty&&t-(UI.emDrawn||0)>250){UI.emDrawn=t;setHTML($('emergw'),emergencyHTML());}}
  if(on){const x=now();PERF.sim+=x-q;q=x;}
  if(UI.advMore){UI.advMore=false;try{advStep();}catch(e){if(typeof reportFault==='function')reportFault('advice',e);}} // head office's advice is still being worked out (0.36.0)
  if(on){const x=now();PERF.adv+=x-q;q=x;}
  if(UI.dirty){render();UI.dirty=false;}
  if(on){const x=now();PERF.draw+=x-q;q=x;}
  try{drawShips();animWire(t);}catch(e){if(typeof reportFault==='function')reportFault('ships on the chart',e);}
  if(on){const x=now();PERF.map+=x-q;PERF.n++;PERF.worst=Math.max(PERF.worst,gap);perfShow(t);}
  requestAnimationFrame(frame);
}
