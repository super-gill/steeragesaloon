/* ================= LANES =================
   Every ship is always somewhere physical. Service voyages follow their route's lane; ships moving light between
   services follow the shortest chain of lanes (service legs and positioning links) between two ports. */
const LANE_EDGES=(function(){
  const E={},add=(p,q,lane,a,b)=>{(E[p]=E[p]||[]).push({to:q,lane,a,b,d:Math.abs(b-a)});};
  for(const k in CHART.routes){const c=CHART.routes[k].calls;
    for(let i=1;i<c.length;i++){add(c[i-1][0],c[i][0],CHART.routes[k],c[i-1][1],c[i][1]);add(c[i][0],c[i-1][0],CHART.routes[k],c[i][1],c[i-1][1]);}}
  for(const k in CHART.links||{}){const [p,q]=k.split('-'),L=CHART.links[k];add(p,q,L,0,L.dist);add(q,p,L,L.dist,0);}
  return E;
})();
/* a point on a lane by nautical miles along it, with the heading of travel */
function pointOn(L,nm,rev){
  const n=L.nm;nm=clamp(nm,0,L.dist);
  let lo=1,hi=n.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(n[mid]<nm)lo=mid+1;else hi=mid;}
  const i=lo,a=L.pts[i-1],b=L.pts[i],seg=(n[i]-n[i-1])||1,u=clamp((nm-n[i-1])/seg,0,1);
  let ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;if(rev)ang+=180;
  return {x:a[0]+(b[0]-a[0])*u,y:a[1]+(b[1]-a[1])*u,ang};
}
/* the part of a lane between two mileages, in travel order */
function subLane(L,a,b){
  const lo=Math.min(a,b),hi=Math.max(a,b),pts=[],nm=[];
  const p0=pointOn(L,lo);pts.push([p0.x,p0.y]);nm.push(lo);
  for(let i=0;i<L.nm.length;i++)if(L.nm[i]>lo&&L.nm[i]<hi){pts.push(L.pts[i]);nm.push(L.nm[i]);}
  const p1=pointOn(L,hi);pts.push([p1.x,p1.y]);nm.push(hi);
  if(a>b){pts.reverse();nm.reverse();return {pts,nm:nm.map(v=>hi-v)};}
  return {pts,nm:nm.map(v=>v-lo)};
}
const TRACKS={};
/* the track a ship follows sailing light from one port to another */
function trackBetween(from,to){
  const key=from+'>'+to;if(TRACKS[key])return TRACKS[key];
  const dist={[from]:0},prev={},done=new Set();
  while(true){let u=null;for(const k in dist)if(!done.has(k)&&(u===null||dist[k]<dist[u]))u=k;
    if(u===null||u===to)break;done.add(u);
    for(const e of LANE_EDGES[u]||[]){const d=dist[u]+e.d;if(dist[e.to]===undefined||d<dist[e.to]){dist[e.to]=d;prev[e.to]={from:u,e};}}}
  let T;
  if(from===to||dist[to]===undefined){const a=CHART.ports[from],b=CHART.ports[to];T={pts:[a,b],nm:[0,from===to?0:gcDist(from,to)],dist:from===to?0:gcDist(from,to)};}
  else{const chain=[];for(let v=to;v!==from;v=prev[v].from)chain.unshift(prev[v].e);
    const pts=[],nm=[];let off=0;
    for(const e of chain){const s=subLane(e.lane,e.a,e.b);
      s.pts.forEach((p,i)=>{if(pts.length&&i===0)return;pts.push(p);nm.push(off+s.nm[i]);});off+=e.d;}
    T={pts,nm,dist:off};}
  return TRACKS[key]=T;
}
const laneDist=(from,to)=>trackBetween(from,to).dist;
