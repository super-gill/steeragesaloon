// Generates js/chart-data.js: Natural Earth 50m land (public domain) in Mercator, ports, and sea lanes.
// Usage: node tools/gen-chart.mjs  (needs: npm i world-atlas@2 topojson-client@3 d3-geo@3 in a scratch folder; set NODE_PATH)
import fs from 'fs';
import * as topo from 'topojson-client';
import {geoMercator, geoPath, geoInterpolate, geoGraticule} from 'd3-geo';
const W=1400, lon0=-100, lon1=40, lat0=-40, lat1=72;
const rad=Math.PI/180, s=W/((lon1-lon0)*rad);
const my=p=>Math.log(Math.tan(Math.PI/4+p*rad/2));
const tx=-s*lon0*rad, ty=s*my(lat1), H=Math.round(s*(my(lat1)-my(lat0)));
const proj=geoMercator().scale(s).translate([tx,ty]).clipExtent([[-2,-2],[W+2,H+2]]);
const path=geoPath(proj);
const atlas=process.env.ATLAS||'node_modules/world-atlas/land-50m.json';
const w=JSON.parse(fs.readFileSync(atlas));
const land=topo.feature(w,w.objects.land);
const r1=d=>d.replace(/-?\d+\.\d+/g,x=>(+x).toFixed(1));
const landD=r1(path(land));
const grat=r1(path(geoGraticule().step([10,10]).extent([[lon0-10,lat0-5],[lon1+10,lat1+5]])()));

export const PORTS={
  GLA:['Glasgow',-4.25,55.86], LIV:['Liverpool',-2.99,53.41], SOU:['Southampton',-1.40,50.90], CHE:['Cherbourg',-1.62,49.65],
  QUE:['Queenstown',-8.30,51.85], MOV:['Moville',-7.04,55.19], HAM:['Hamburg',9.99,53.55], AVO:['Avonmouth',-2.70,51.50],
  GEN:['Genoa',8.93,44.41], NAP:['Naples',14.27,40.84], GIB:['Gibraltar',-5.35,36.14], LIS:['Lisbon',-9.14,38.72],
  NYC:['New York',-74.0,40.70], HAL:['Halifax',-63.57,44.65], SJN:['Saint John',-66.06,45.27], QBC:['Quebec',-71.21,46.81],
  MTL:['Montreal',-73.55,45.50], NOL:['New Orleans',-90.07,29.95], GAL:['Galveston',-94.80,29.30], KIN:['Kingston',-76.79,17.97],
  FRE:['Freetown',-13.23,8.48], LAG:['Lagos',3.39,6.45], RIO:['Rio de Janeiro',-43.17,-22.91], MVD:['Montevideo',-56.19,-34.91],
  BUE:['Buenos Aires',-58.37,-34.60]
};
// Sea lanes between consecutive calls. '*' marks a great-circle leg to the next waypoint.
const NYC_APPROACH=[[-68.5,40.4],[-72.8,40.2],[-73.8,40.45],[-74.0,40.7]];
const MERSEY_OUT=[[-2.99,53.41],[-3.6,53.5],[-4.9,53.4],[-5.6,52.4],[-6.4,51.9]];
const CLYDE_OUT=[[-4.25,55.86],[-4.9,55.6],[-5.3,55.25],[-5.9,55.35]];
const SOLENT_OUT=[[-1.40,50.90],[-1.30,50.78],[-1.10,50.74],[-0.93,50.70],[-0.98,50.45]];
const SEG={
  'GLA-HAL':[...CLYDE_OUT,[-7.3,55.55],[-10.5,55.6],'*',[-50,46.2],[-56,45.3],[-59.5,44.6],[-62.5,44.3],[-63.57,44.65]],
  'LIV-HAL':[...MERSEY_OUT,[-8.3,51.5],[-10.5,51.2],'*',[-50,46.0],[-56,45.3],[-59.5,44.6],[-62.5,44.3],[-63.57,44.65]],
  'LIV-QUE':[...MERSEY_OUT,[-7.6,51.7],[-8.30,51.85]],
  'QUE-NYC':[[-8.30,51.85],[-8.3,51.6],[-10.5,51.2],'*',[-50,42.3],'*',...NYC_APPROACH],
  'GLA-MOV':[...CLYDE_OUT,[-6.9,55.35],[-6.95,55.25],[-7.04,55.19]],
  'MOV-NYC':[[-7.04,55.19],[-6.95,55.3],[-7.4,55.5],[-10.5,55.4],'*',[-50,42.6],'*',...NYC_APPROACH],
  'MOV-QBC':[[-7.04,55.19],[-6.95,55.3],[-7.4,55.5],[-10.5,55.4],'*',[-54.2,52.3],[-55.4,51.95],[-56.8,51.45],[-58.3,50.85],[-60.5,50.15],[-63.0,50.05],[-64.6,49.9],[-66.2,49.5],[-67.6,49.0],[-68.6,48.55],[-69.6,47.95],[-70.6,47.25],[-71.21,46.81]],
  'QBC-MTL':[[-71.21,46.81],[-71.8,46.55],[-72.6,46.25],[-73.1,45.95],[-73.55,45.50]],
  'MOV-SJN':[[-7.04,55.19],[-6.95,55.3],[-7.4,55.5],[-10.5,55.4],'*',[-50,46.2],[-56,45.3],[-59.5,44.6],[-63.5,43.9],[-65.6,43.2],[-66.4,43.55],[-66.55,44.45],[-66.3,44.95],[-66.06,45.27]],
  'GEN-NAP':[[8.93,44.41],[9.0,44.1],[9.7,43.25],[9.8,42.9],[9.98,42.45],[10.8,41.85],[12.0,41.0],[13.0,40.65],[13.9,40.6],[14.27,40.84]],
  'NAP-GIB':[[14.27,40.84],[13.9,40.55],[12.6,39.3],[11.0,38.35],[9.5,38.1],[6,37.7],[2.5,37.4],[-0.5,36.9],[-2.5,36.3],[-5.35,36.14]],
  'GIB-NYC':[[-5.35,36.14],[-7.2,36.2],[-9.3,36.8],'*',...NYC_APPROACH],
  'SOU-CHE':[...SOLENT_OUT,[-1.5,49.9],[-1.62,49.65]],
  'CHE-NYC':[[-1.62,49.65],[-2.0,49.85],[-3.5,49.95],[-5.8,49.75],[-7.5,49.6],'*',[-50,42.3],'*',...NYC_APPROACH],
  'HAM-SOU':[[9.99,53.55],[9.4,53.75],[8.6,53.95],[7.8,54.05],[6.0,53.8],[4.5,53.3],[3.0,51.9],[1.9,51.2],[1.2,50.9],[0.0,50.6],[-1.0,50.62],[-1.05,50.72],[-1.30,50.78],[-1.40,50.90]],
  'LIV-NOL':[...MERSEY_OUT,[-8.3,51.5],[-10.5,50.8],'*',[-66,27.5],[-74.5,26.4],[-76.9,26.05],[-78.6,26.05],[-79.45,25.85],[-79.95,25.3],[-80.6,24.45],[-82.5,24.25],[-84.5,24.6],[-88.3,28.3],[-89.2,28.9],[-89.4,29.25],[-89.7,29.5],[-90.07,29.95]],
  'NOL-GAL':[[-90.07,29.95],[-89.7,29.5],[-89.4,29.25],[-89.2,28.9],[-90.5,28.6],[-93.0,28.9],[-94.3,29.15],[-94.80,29.30]],
  'AVO-KIN':[[-2.70,51.50],[-3.3,51.35],[-4.4,51.2],[-5.6,51.0],[-6.6,50.5],'*',[-64.5,21.8],[-70.5,20.6],[-73.8,20.0],[-75.2,19.0],[-76.2,17.75],[-76.79,17.95]],
  'LIV-FRE':[...MERSEY_OUT,[-8.3,51.5],[-10.5,50.5],[-10.6,43.5],[-11.2,37.0],[-13.8,30.0],[-16.2,26.5],[-17.9,21.0],[-17.9,14.6],[-17.5,12.2],[-16.9,10.8],[-15.3,9.3],[-13.6,8.55],[-13.23,8.48]],
  'FRE-LAG':[[-13.23,8.48],[-13.5,8.2],[-12.8,6.8],[-10.5,5.2],[-7.5,4.2],[-3.0,4.6],[1.0,5.8],[3.35,6.3],[3.39,6.45]],
  'LIV-LIS':[...MERSEY_OUT,[-8.3,51.5],[-10.5,50.5],[-10.6,43.5],[-9.9,39.5],[-9.4,38.65],[-9.14,38.72]],
  'LIS-RIO':[[-9.14,38.72],[-9.4,38.6],[-11.2,37.0],[-14.5,30.0],[-18.5,20.0],[-25.5,5.0],[-32.5,-5.0],[-34.2,-9.0],[-37.5,-18.0],[-40.8,-22.8],[-42.6,-23.3],[-43.15,-22.97],[-43.17,-22.91]],
  'RIO-MVD':[[-43.17,-22.91],[-43.2,-23.15],[-45.0,-24.6],[-47.9,-27.2],[-49.2,-29.5],[-50.9,-32.0],[-53.4,-34.8],[-54.7,-35.3],[-55.6,-35.2],[-56.19,-34.95]],
  'MVD-BUE':[[-56.19,-34.91],[-56.7,-34.95],[-57.5,-34.75],[-58.37,-34.60]]
};
// Services: calls in outbound order (homeward reverses them). A route may have a winter variant.
const ROUTES={
  hal:['GLA','HAL'], lha:['LIV','HAL'], liv:['LIV','QUE','NYC'], gny:['GLA','MOV','NYC'], nap:['GEN','NAP','GIB','NYC'],
  stl:['GLA','MOV','QBC','MTL'], stlw:['GLA','MOV','SJN'], exp:['SOU','CHE','NYC'], ham:['HAM','SOU','CHE','NYC'],
  cot:['LIV','NOL','GAL'], ban:['AVO','KIN'], waf:['LIV','FRE','LAG'], rpl:['LIV','LIS','RIO','MVD','BUE']
};
const hv=(a,b)=>{const R=6371,la1=a[1]*rad,la2=b[1]*rad,dl=(b[0]-a[0])*rad,dp=la2-la1;const h=Math.sin(dp/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2;return 2*R*Math.asin(Math.sqrt(h))/1.852;};
function expand(L){const pts=[];for(let i=0;i<L.length;i++){if(L[i]==='*'){const a=L[i-1],b=L[i+1],f=geoInterpolate(a,b);for(let j=1;j<40;j++)pts.push(f(j/40));continue;}pts.push(L[i]);}return pts;}
const out={};
for(const [k,calls] of Object.entries(ROUTES)){
  let ll=[],callNm=[[calls[0],0]];
  for(let i=1;i<calls.length;i++){
    const key=calls[i-1]+'-'+calls[i];if(!SEG[key])throw new Error('missing segment '+key);
    const seg=expand(SEG[key]);ll=ll.concat(ll.length?seg.slice(1):seg);
    let d=0;for(let j=1;j<ll.length;j++)d+=hv(ll[j-1],ll[j]);callNm.push([calls[i],Math.round(d)]);
  }
  const nm=[0];for(let j=1;j<ll.length;j++)nm.push(nm[j-1]+hv(ll[j-1],ll[j]));
  out[k]={pts:ll.map(p=>proj(p).map(v=>+v.toFixed(1))),nm:nm.map(v=>Math.round(v)),calls:callNm,dist:Math.round(nm[nm.length-1])};
}
const f0=proj([-80,61]),f1=proj([20,33.5]);
const ports={},lonlat={};for(const [c,[n,lo,la]] of Object.entries(PORTS)){ports[c]=proj([lo,la]).map(v=>+v.toFixed(1));lonlat[c]=[lo,la];}
const chart={W,H,focus:[f0[0],f0[1],f1[0],f1[1]].map(v=>+v.toFixed(1)),land:landD,grat,ports,portNames:Object.fromEntries(Object.entries(PORTS).map(([c,[n]])=>[c,n])),lonlat,routes:out};
fs.writeFileSync(process.env.OUT||'chart.json',JSON.stringify(chart));
console.log('H',H,'land',landD.length,Object.entries(out).map(([k,v])=>k+':'+v.dist+'nm '+v.calls.map(c=>c[0]+'@'+c[1]).join('>')).join('\n'));
