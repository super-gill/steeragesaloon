/* ================= SHIP PROFILE ================= */
const CARGO_LAY=['island','castle','motor','fruit'];
function profileSVG(sh,mode,build){
  const VH=250,wl=195,k=1; // every ship is drawn to the same plan, then scaled as a whole by her size
  const L=400+k*190,VW=L+80,x0=40,hH=30+k*12,dy=wl-hH,X=f=>x0+L*f,bot=wl+16;
  const cid='hc'+sh.id+mode;
  const D=sh.design||{},lay=layoutOf(sh),cargoLay=CARGO_LAY.includes(lay);
  const rake=D.form?(D.form==='trad'?5:D.form==='maier'?22:D.form==='bulb'||D.form==='tank'?20:16):({island:6,castle:18,motor:30,fruit:24,modern:28,stream:20}[lay]||16);
  const cruiser=['castle','motor','fruit','stream','modern'].includes(lay);
  const bulb=D.form==='bulb'||D.form==='tank'?` Q${x0+L-rake+12},${bot-4} ${x0+L-rake+6},${bot+2}`:'';
  const hull=`M${x0+(cruiser?6:0)},${dy} L${X(.97)},${dy-5} L${x0+L},${dy-7} L${x0+L-rake},${bot-6}${bulb} L${x0+L-rake-4},${bot} L${X(.08)},${bot} ${cruiser?`Q${x0+2},${bot-2} ${x0},${dy+22} Q${x0},${dy+8} ${x0+6},${dy}`:`Q${x0+4},${wl+10} ${x0+2},${dy+16} Q${x0-2},${dy+6} ${x0},${dy}`} Z`;
  const nF0=D.funnels||(sh.grt>=12000?3:sh.grt>=8500?2:1),nF=lay==='modern'?1:lay==='stream'?Math.min(2,nF0):nF0;
  let fw=L*0.04*(lay==='modern'?1.9:lay==='stream'?1.4:1),fh=L*(nF>=3?0.095:0.105)*(lay==='modern'?0.72:lay==='stream'?0.88:1);const gap=fw*0.9;
  // the funnels stand on the top deck, so the superstructure steps in only as far as they allow
  const tiers=sh.grt<7000?2:sh.grt<11000?3:sh.grt<30000?4:5,th=11,s0=X(.24),s1=X(.76),bridge=30;
  const needTop=nF*fw+(nF-1)*gap+bridge+fw*1.2,topW=Math.max(L*0.2,Math.min(s1-s0,needTop)),step=tiers>1?((s1-s0)-topW)/(tiers-1):0;
  const T=[];for(let i=0;i<tiers;i++)T.push(lay==='stream'?{a:s0+i*step*0.8,b:s1-i*step*0.2,y:dy-th*(i+1)}:{a:s0+i*step*0.45,b:s1-i*step*0.55,y:dy-th*(i+1)}); // thirties liners terrace their after decks
  // cargo layouts: a small house amidships instead of the liner's decks, and one funnel
  const CG={island:{T:[[.47,.58,22,10],[.52,.58,31,9]],fx:.5,fb:12,fh:64,fw:.028},castle:{T:[[.40,.64,24,13],[.52,.63,35,11]],fx:.47,fb:24,fh:50,fw:.045},
    motor:{T:[[.42,.61,14,13],[.51,.59,26,12]],fx:.45,fb:14,fh:26,fw:.05},fruit:{T:[[.38,.63,13,13],[.44,.62,25,12]],fx:.49,fb:25,fh:46,fw:.04}}[lay];
  if(CG){T.length=0;for(const [a,b,y,h] of CG.T)T.push({a:X(a),b:X(b),y:dy-y,h});fw=L*CG.fw;fh=CG.fh;}
  const top=T[T.length-1],topY=CG?dy-CG.fb:top.y;
  // funnels spaced evenly between the after end of the top deck and the bridge, raked aft, bases on the deck
  const fa=top.a+fw*0.6+fw/2,fb=top.b-bridge-fw*0.6-fw/2,fx=[];
  if(CG)fx.push(X(CG.fx));else if(lay==='modern')fx.push(top.a+(top.b-top.a)*0.4);else for(let i=0;i<nF;i++)fx.push(nF===1?(fa+fb)/2:fa+(fb-fa)*i/(nF-1));
  const mastH=topY-fh-26,fm=X(.84),am=X(.15);
  const cut=mode==='cut';
  const B=build||null,onSlip=B&&(B.stage==='framing'||B.stage==='plating'),inYard=sh.state==='yard'||onSlip||(B&&B.stage==='fitting');
  let s=`<svg class="profile" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${cut?'Cutaway':'Profile'} of SS ${sh.name}"><defs><clipPath id="${cid}"><path d="${hull}"/></clipPath></defs>`;
  s+=`<rect width="${VW}" height="${VH}" style="fill:${cut?'var(--surface2)':'var(--sky)'}"/>`;
  const f=0.64+0.36*Math.sqrt(clamp((sh.grt-3000)/60000,0,1));s+=`<g transform="translate(${VW/2} ${wl}) scale(${f.toFixed(3)}) translate(${-VW/2} ${-wl})">`;
  if(inYard&&!cut){s+=`<rect x="0" y="${bot}" width="${VW}" height="${VH-bot}" style="fill:var(--line)"/><rect x="${x0-30}" y="${bot-40}" width="8" height="${VH-bot+40}" style="fill:var(--muted)"/><rect x="${x0+L+22}" y="${bot-40}" width="8" height="${VH-bot+40}" style="fill:var(--muted)"/>`;
    for(let x=X(.1);x<X(.92);x+=40)s+=`<rect x="${x}" y="${bot}" width="14" height="8" style="fill:var(--muted)"/>`;}
  // masts and rigging
  const mc=cut?'var(--muted)':'#2B2E30';
  if(lay==='modern')s+=`<g stroke="${mc}" fill="none"><line x1="${top.b-10}" y1="${topY-9}" x2="${top.b-14}" y2="${topY-58}" stroke-width="2"/><line x1="${fm}" y1="${dy-4}" x2="${fm}" y2="${dy-30}" stroke-width="1.6"/></g>`;
  else if(!cargoLay)s+=`<g stroke="${mc}" fill="none"><line x1="${fm}" y1="${dy}" x2="${fm}" y2="${mastH}" stroke-width="2.2"/><line x1="${am}" y1="${dy}" x2="${am}" y2="${mastH+6}" stroke-width="2.2"/>
    <line x1="${fm}" y1="${mastH}" x2="${x0+L}" y2="${dy-7}" stroke-width=".7" opacity=".6"/><line x1="${am}" y1="${mastH+6}" x2="${x0+1}" y2="${dy}" stroke-width=".7" opacity=".6"/>
    ${sh.up&&sh.up.wireless?`<line x1="${fm}" y1="${mastH+2}" x2="${am}" y2="${mastH+8}" stroke-width=".6" opacity=".55"/>`:''}
    <line x1="${fm}" y1="${dy-18}" x2="${fm+22}" y2="${dy-4}" stroke-width="1.2"/><line x1="${am}" y1="${dy-18}" x2="${am-22}" y2="${dy-4}" stroke-width="1.2"/></g>`;
  if(B&&!cut&&(B.stage==='drawing'||B.stage==='waiting')){
    s+=`<g style="stroke:var(--muted);fill:none" stroke-dasharray="5 4"><path d="${hull}"/></g>`;
    s+=`<text x="${VW/2}" y="${VH-14}" text-anchor="middle" font-size="11" style="fill:var(--muted);font-family:var(--body)">${B.stage==='drawing'?'On the drawing board':'Waiting for a slip'}</text></g></svg>`;return s;}
  if(onSlip&&!cut){
    const pl=B.stage==='plating'?clamp((B.prog-0.3)/0.32,0,1):0;
    s+=`<g clip-path="url(#${cid})">`;for(let x=x0;x<x0+L;x+=7)s+=`<line x1="${x}" y1="${dy-10}" x2="${x}" y2="${bot+4}" style="stroke:#6B6258" stroke-width="1.3"/>`;
    s+=`<rect x="${x0-4}" y="${dy-10}" width="${(L+8)*pl}" height="${bot-dy+14}" style="fill:#3A3F42"/></g>`;
    s+=`<path d="${hull}" style="fill:none;stroke:#6B6258" stroke-width="1.2"/><line x1="${x0}" y1="${bot}" x2="${x0+L}" y2="${bot}" style="stroke:#6B6258" stroke-width="3"/>`;
    for(let x=x0-10;x<x0+L+20;x+=46)s+=`<line x1="${x}" y1="${bot}" x2="${x+30}" y2="${dy-40}" style="stroke:var(--muted)" stroke-width="1.5" opacity=".5"/>`;
    s+=`<line x1="${x0-24}" y1="${VH}" x2="${x0-24}" y2="12" style="stroke:var(--ink)" stroke-width="3"/><line x1="${x0-24}" y1="14" x2="${x0+L*0.45}" y2="14" style="stroke:var(--ink)" stroke-width="2"/>`;
    s+=`<text x="${VW/2}" y="${VH-4}" text-anchor="middle" font-size="11" style="fill:var(--muted);font-family:var(--body)">${B.stage==='framing'?'Framing on the slip':'Plating the hull'}, ${Math.round(B.prog*100)}%</text></g></svg>`;return s;}
  const fitP=B&&B.stage==='fitting'?clamp((B.prog-0.62)/0.38,0,1):1;
  if(!cut){
    // smoke
    const smoking=(sh.state==='sea'&&sh.stopLeft<=0)||sh.state==='port'||sh.state==='repo';
    if(smoking){const coal=sh.fuel==='coal',heavy=sh.limp,col=heavy?'#1c1c1c':coal?'#46494b':'#A8AEB1',n=sh.state==='port'?2:4;
      for(const cx of fx){const tx=cx-7,ty=topY-fh;s+=`<g class="smoke" style="fill:${col}">`;
        for(let i=0;i<n;i++)s+=`<circle cx="${tx-10-i*16}" cy="${ty-5-i*5}" r="${(heavy?7:5)+i*2.2}" opacity="${(coal?0.55:0.35)-i*0.1}"/>`;s+='</g>';
        if(heavy)s+=`<circle cx="${tx}" cy="${ty+2}" r="4" style="fill:#E0632F" opacity=".8"/>`;}}
    // hull
    const white=lay==='fruit'||lay==='modern'||!!sh.cruiser,hc=white?'#F3F1EA':lay==='motor'?'#6E767B':'#1C2226',bootC=lay==='fruit'||lay==='motor'?'#3D6B3A':'#9C2F22';
    s+=`<path d="${hull}" style="fill:${hc}${white?';stroke:#BDB6A6':''}" stroke-width=".6"/>`;
    s+=`<g clip-path="url(#${cid})"><rect x="${x0-5}" y="${inYard?wl-4:wl-4}" width="${L+10}" height="${inYard?30:8}" style="fill:${bootC}"/>${lay==='fruit'?`<rect x="${x0-5}" y="${dy+3}" width="${L+10}" height="2" style="fill:#1B4757"/>`:''}</g>`;
    if(!cargoLay){
      s+=`<line x1="${x0+4}" y1="${dy+3}" x2="${X(.97)}" y2="${dy-2}" stroke="${white?'#1B4757':'#D9D2C0'}" stroke-width="${white?1.4:.8}" opacity=".6"/>`;
      s+=`<rect x="${X(.86)}" y="${dy-11}" width="${L*0.11}" height="7" style="fill:${hc}"/><rect x="${x0+3}" y="${dy-6}" width="${L*0.09}" height="6" style="fill:${hc}"/>`;
      for(let row=0;row<2;row++)for(let x=X(.06);x<X(.92);x+=8)s+=`<circle cx="${x}" cy="${dy+9+row*8}" r="1.1" style="fill:${white?'#3A4650':'#D8D0B8'}" opacity=".8"/>`;
      // superstructure: square Edwardian fronts, or rounded thirties and post-war ones
      const rx=lay==='classic'?0:lay==='stream'?6:3;
      T.forEach((t,i)=>{if(fitP<(i+1)/(T.length+1))return;s+=`<rect x="${t.a}" y="${t.y}" width="${t.b-t.a}" height="${th}" rx="${rx}" style="fill:#EFECE4;stroke:#BDB6A6" stroke-width=".6"/>`;
        for(let x=t.a+4;x<t.b-4;x+=7)s+=`<rect x="${x}" y="${t.y+3.5}" width="3" height="3.6" style="fill:#3A4650"/>`;});
      s+=`<rect x="${top.b-24}" y="${topY-9}" width="28" height="9" rx="${rx}" style="fill:#EFECE4;stroke:#BDB6A6" stroke-width=".6"/>`;
      for(let x=top.b-21;x<top.b+2;x+=5)s+=`<rect x="${x}" y="${topY-7}" width="3" height="3" style="fill:#3A4650"/>`;
      for(let x=top.a+8;x<top.b-34;x+=22)if(fx.every(c=>Math.abs(x-(c-fw*0.2))>fw*0.9))s+=`<ellipse cx="${x}" cy="${topY-3}" rx="8" ry="2.6" style="fill:#F5F3EE;stroke:#9A9A9A" stroke-width=".5"/>`;
    } else s+=cargoTop(lay,{x0,L,X,dy,wl,T,hc,fitP,pax:CL.reduce((a,c)=>a+(sh.berths[c]||0),0)});
    // funnels
    for(const cx of (fitP>0.8?fx:[])){const b=cx-fw/2,e=cx+fw/2,tb=topY-fh,rk=7;
      const at=(h)=>-rk*h;
      s+=`<polygon points="${b},${topY} ${e},${topY} ${e+at(1)},${tb} ${b+at(1)},${tb}" style="fill:#C79A4E"/>`;
      const y1=topY-fh*.55,y2=topY-fh*.68;s+=`<polygon points="${b+at(.55)},${y1} ${e+at(.55)},${y1} ${e+at(.68)},${y2} ${b+at(.68)},${y2}" style="fill:#1B4757"/>`;
      const y3=topY-fh*.82;s+=`<polygon points="${b+at(.82)},${y3} ${e+at(.82)},${y3} ${e+at(1)},${tb} ${b+at(1)},${tb}" style="fill:#15181A"/>`;}
    // rust
    const R=seed(sh.id*7919+3),nr=Math.max(0,Math.round((85-sh.cond)/5));
    for(let i=0;i<nr;i++){const x=X(.05+R()*.9),y=dy+1+R()*6,l=5+R()*16;s+=`<line x1="${x}" y1="${y}" x2="${x+0.5}" y2="${y+l}" stroke="#8A4A26" stroke-width="1.4" opacity=".6"/>`;}
    if(sh.cond<50)for(let i=0;i<nr/2;i++){const t=T[Math.floor(R()*T.length)],x=t.a+R()*(t.b-t.a);s+=`<line x1="${x}" y1="${t.y+2}" x2="${x}" y2="${t.y+4+R()*7}" stroke="#8A4A26" stroke-width="1.2" opacity=".5"/>`;}
    s+=`<text x="${X(.93)}" y="${dy+6}" font-size="6" letter-spacing="1" text-anchor="end" style="fill:${lay==='fruit'||lay==='modern'?'#1B4757':lay==='motor'?'#1C2226':'#D9D2C0'};font-family:var(--body)">${sh.name.toUpperCase()}</text>`;
    s+='</g>';
    if(!inYard){s+=`<rect x="0" y="${wl}" width="${VW}" height="${VH-wl}" style="fill:var(--chart-sea)" opacity=".94"/>`;
      s+=`<path d="M0 ${wl+12} q20 -4 40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0 t40 0" style="fill:none;stroke:var(--sky)" opacity=".5"/>`;
      if(sh.state==='sea'&&sh.stopLeft<=0)s+=`<path d="M${x0+L-14} ${wl} q-30 6 -70 3" style="fill:none;stroke:var(--sky)" stroke-width="1.5" opacity=".7"/>`;}
    s+='</svg>';return s;
  }
  // cutaway
  const src=sh.load||sh.lastLoad;
  const occ=c=>src&&src.pax[c]?src.pax[c].n/Math.max(1,sh.berths[c]):0;
  const cargoOcc=src?src.cargoT/Math.max(1,sh.cargo):0;
  const B1=[dy,dy+14],B2=[dy+14,dy+28],B3=[dy+28,bot];
  const reg=(x1,x2,y1,y2,col,o,clip)=>`<g ${clip?`clip-path="url(#${cid})"`:''}><rect x="${X(x1)}" y="${y1}" width="${L*(x2-x1)}" height="${y2-y1}" style="fill:var(--line);stroke:var(--muted)" stroke-width=".4" opacity=".6"/>
    <rect x="${X(x1)}" y="${y1}" width="${L*(x2-x1)*clamp(o,0,1)}" height="${y2-y1}" style="fill:${col}" opacity=".85"/></g>`;
  s+=`<path d="${hull}" style="fill:var(--surface);stroke:var(--ink)" stroke-width="1.2"/>`;
  // spaces aboard, laid out from what she actually carries: cargo fills the holds from the bottom up,
  // passengers fill from the top down, best class highest and amidships; anything left is crew, stores and mail
  const R_=(a,b,y1,y2,hull)=>({x1:a,x2:b,y1,y2,hull,left:a});
  const tierSlots=T.slice().reverse().map(t=>R_(t.a,t.b,t.y,t.y+(t.h||th),false));
  const h1=[R_(X(.36),X(.60),B1[0],B1[1],true),R_(X(.05),X(.36),B1[0],B1[1],true),R_(X(.60),X(.95),B1[0],B1[1],true)];
  const h2=[R_(X(.06),X(.33),B2[0],B2[1],true),R_(X(.63),X(.93),B2[0],B2[1],true)];
  const h3=[R_(X(.08),X(.33),B3[0],B3[1],true),R_(X(.63),X(.94),B3[0],B3[1],true)];
  const all=tierSlots.concat(h1,h2,h3),area=r=>(r.x2-r.left)*(r.y2-r.y1),total=all.reduce((a,r)=>a+(r.x2-r.x1)*(r.y2-r.y1),0);
  const PER={f:14,s:8,t:3.2,tt:5.5},paxSpace=CL.reduce((a,c)=>a+(sh.berths[c]||0)*PER[c],0),cargoSpace=(sh.cargo||0)/1.3;
  const segs=[];
  const carve=(order,amt,col,o)=>{for(const r of order){if(amt<=0.5)break;const a=area(r);if(a<=0.5)continue;
    const take=Math.min(a,amt),w=take/(r.y2-r.y1);segs.push({x1:r.left,x2:r.left+w,y1:r.y1,y2:r.y2,hull:r.hull,col,o});r.left+=w;amt-=take;}};
  const fullness=Math.min(1,(paxSpace+cargoSpace)/Math.max(1,sh.grt*0.9));
  const avail=total*Math.max(0.55,fullness);
  carve([h3[1],h3[0],h2[1],h2[0],h1[2],h1[1]],avail*cargoSpace/Math.max(1,paxSpace+cargoSpace),'#8A6A45',cargoOcc);
  const pOrder=tierSlots.concat(h1,h2,h3);
  for(const c of ['f','s','tt','t'])if(sh.berths[c])carve(pOrder,avail*(sh.berths[c]*PER[c])/Math.max(1,paxSpace+cargoSpace),CL_COL[c],occ(c));
  const box=(r,col,o,hull)=>`<g ${hull?`clip-path="url(#${cid})"`:''}><rect x="${r.x1}" y="${r.y1}" width="${Math.max(0,r.x2-r.x1)}" height="${r.y2-r.y1}" style="fill:${col};stroke:var(--muted)" stroke-width=".4" opacity=".6"/></g>`;
  for(const r of all)s+=box(r,'var(--line)',0,r.hull);
  for(const g of segs)s+=`<g ${g.hull?`clip-path="url(#${cid})"`:''}><rect x="${g.x1}" y="${g.y1}" width="${Math.max(0,g.x2-g.x1)}" height="${g.y2-g.y1}" style="fill:${g.col}" opacity="${src?'.28':'.7'}"/><rect x="${g.x1}" y="${g.y1}" width="${Math.max(0,(g.x2-g.x1)*clamp(g.o,0,1))}" height="${g.y2-g.y1}" style="fill:${g.col}" opacity=".85"/></g>`;
  s+=`<g clip-path="url(#${cid})"><rect x="${X(.36)}" y="${B2[0]}" width="${L*.24}" height="${bot-B2[0]}" style="fill:var(--muted)" opacity=".45"/>
    <rect x="${X(.33)}" y="${B2[0]}" width="${L*.03}" height="${bot-B2[0]}" style="fill:${sh.fuel==='coal'?'#2A2A2A':'#A8742A'}" opacity=".8"/>
    <rect x="${X(.60)}" y="${B2[0]}" width="${L*.03}" height="${bot-B2[0]}" style="fill:${sh.fuel==='coal'?'#2A2A2A':'#A8742A'}" opacity=".8"/></g>`;
  s+=`<g clip-path="url(#${cid})" stroke="var(--ink)" stroke-width=".6" opacity=".7"><line x1="${x0}" y1="${B1[1]}" x2="${x0+L}" y2="${B1[1]}"/><line x1="${x0}" y1="${B2[1]}" x2="${x0+L}" y2="${B2[1]}"/></g>`;
  s+=`<line x1="0" y1="${wl}" x2="${VW}" y2="${wl}" style="stroke:var(--muted)" stroke-dasharray="4 4"/>`;
  for(const cx of fx){const b=cx-fw/2,e=cx+fw/2;s+=`<polygon points="${b},${topY} ${e},${topY} ${e-7},${topY-fh} ${b-7},${topY-fh}" style="fill:none;stroke:var(--muted)"/>`;}
  s+='</g></svg>';return s;
}
function legendHTML(sh){
  const src=sh.load||sh.lastLoad;
  const it=CL.filter(c=>sh.berths[c]).map(c=>`<span><i style="background:${CL_COL[c]}"></i>${CL_NAME[c]} ${src&&src.pax[c]?int(src.pax[c].n):0} of ${sh.berths[c]}</span>`);
  it.push(`<span><i style="background:#8A6A45"></i>Cargo ${src?int(src.cargoT):0} of ${int(sh.cargo)} t</span>`);
  it.push(`<span><i style="background:var(--muted)"></i>Engines, ${sh.fuel==='coal'?'coal bunkers':'oil tanks'}</span>`);
  it.push(`<span><i style="background:var(--line)"></i>Crew, stores and mail</span>`);
  return `<div class="legend">${it.join('')}</div><p class="note">${sh.load?'Current crossing':sh.lastLoad?'Last crossing':'No crossings yet'}.</p>`;
}

/* the decks of a cargo ship: raised islands, hatches, masts and cargo posts with their booms, and a small house */
function cargoTop(lay,g){
  const {x0,L,X,dy,T,hc,fitP,pax}=g,mc='#2B2E30',kc=lay==='motor'?'#4A5053':mc;let s='';
  const poly=(pts,fill,ex='')=>`<polygon points="${pts.map(p=>p.join(',')).join(' ')}" style="fill:${fill}" ${ex}/>`;
  const line=(x1,y1,x2,y2,c,w,ex='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${c}" stroke-width="${w}" ${ex}/>`;
  const hatch=(x,y,w)=>`<rect x="${x}" y="${y-4}" width="${w}" height="4" style="fill:#5A4A3A"/><rect x="${x}" y="${y-5}" width="${w}" height="1.4" style="fill:#8A7A62"/>`;
  const boom=(x,y,h,d,c)=>line(x,y,x,y-h,c,2)+line(x,y-h*0.45,x+d*34,y-4,c,1.3)+line(x,y-h,x+d*34,y-4,c,.6,'opacity=".6"');
  const edge=lay==='fruit'?'stroke:#BDB6A6;stroke-width:.6':'';
  // forecastle (and for the tramp, the bridge island and the poop)
  s+=poly([[X(.87),dy-5],[x0+L,dy-7],[x0+L,dy-16],[X(.87),dy-14]],hc,`style="fill:${hc};${edge}"`);
  if(lay==='island'){s+=poly([[X(.40),dy],[X(.60),dy-2],[X(.60),dy-12],[X(.40),dy-10]],hc)+poly([[x0,dy],[X(.11),dy],[X(.11),dy-9],[x0,dy-9]],hc);}
  if(lay==='castle')s+=poly([[X(.34),dy],[X(.66),dy-3],[X(.66),dy-12],[X(.34),dy-10]],hc);
  // hatches fore and aft
  for(const [a,w] of [[.64,24],[.75,24],[.15,24],[.27,24]])s+=hatch(X(a),dy-(a>.5?3:0),w);
  // masts and booms: masts on the tramp, paired cargo posts on the others
  if(lay==='island'){for(const [x,y] of [[X(.8),dy-2],[X(.22),dy]]){s+=boom(x,y,78,-1,mc)+boom(x,y,78,1,mc);}
    s+=line(X(.8),dy-80,x0+L,dy-16,mc,.7,'opacity=".6"')+line(X(.22),dy-78,x0+1,dy-9,mc,.7,'opacity=".6"');}
  else{for(const [x,y] of [[X(.76),dy-3],[X(.21),dy]]){s+=boom(x,y,44,-1,kc)+boom(x,y,44,1,kc);}
    if(lay!=='motor')s+=line(X(.86),dy-5,X(.86),dy-82,mc,2)+line(X(.10),dy,X(.10),dy-76,mc,2);}
  // the house: few windows on a freighter, more when she carries passengers
  const ws=pax>=60?6:9;
  T.forEach((t,i)=>{if(fitP<(i+1)/(T.length+1))return;s+=`<rect x="${t.a}" y="${t.y}" width="${t.b-t.a}" height="${t.h}" rx="${lay==='motor'?4:0}" style="fill:#EFECE4;stroke:#BDB6A6" stroke-width=".6"/>`;
    for(let x=t.a+4;x<t.b-4;x+=ws)s+=`<rect x="${x}" y="${t.y+t.h*0.3}" width="3" height="3.4" style="fill:#3A4650"/>`;});
  if(pax>=60)for(let x=T[0].a+6;x<T[0].b-6;x+=9)s+=`<circle cx="${x}" cy="${dy+8}" r="1.1" style="fill:#D8D0B8" opacity=".8"/>`;
  else for(let x=X(.42);x<X(.58);x+=11)s+=`<circle cx="${x}" cy="${dy-(lay==='island'||lay==='castle'?5:-8)}" r="1" style="fill:#D8D0B8" opacity=".7"/>`;
  return s;
}
