/* ================= CLOCK ================= */
function advance(days){
  while(days>1e-9&&!S.over&&UI.speed>0){
    const next=Math.floor(S.t+1e-9)+1,step=Math.min(days,next-S.t);
    moveAll(step);S.t+=step;days-=step;
    if(S.t>=next-1e-9){S.t=next;dailyTick();UI.dirty=true;}
  }
}
let lastT=performance.now();
function frame(t){
  const dt=Math.min(0.1,(t-lastT)/1000);lastT=t;
  if(S&&!S.over&&UI.speed>0)advance(dt*SPEEDS[UI.speed]);
  if(UI.dirty){render();UI.dirty=false;}
  drawShips();
  requestAnimationFrame(frame);
}
