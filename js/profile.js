/* ================= SHIP PROFILE ================= */
function profileSVG(sh,mode,build){
  const VH=200,wl=150,k=clamp((sh.grt-5500)/9500,0,1);
  const L=400+k*190,VW=L+80,x0=40,hH=30+k*12,dy=wl-hH,X=f=>x0+L*f,bot=wl+16;
  const cid='hc'+sh.id+mode;
  const D=sh.design||{},rake=D.form==='trad'?5:D.form==='maier'?22:D.form==='bulb'||D.form==='tank'?20:16;
  const bulb=D.form==='bulb'||D.form==='tank'?` Q${x0+L-rake+12},${bot-4} ${x0+L-rake+6},${bot+2}`:'';
  const hull=`M${x0},${dy} L${X(.97)},${dy-5} L${x0+L},${dy-7} L${x0+L-rake},${bot-6}${bulb} L${x0+L-rake-4},${bot} L${X(.08)},${bot} Q${x0+4},${wl+10} ${x0+2},${dy+16} Q${x0-2},${dy+6} ${x0},${dy} Z`;
  const tiers=sh.grt<7000?2:sh.grt<11000?3:4,th=11,s0=X(.24),s1=X(.76);
  const T=[];for(let i=0;i<tiers;i++)T.push({a:s0+i*L*0.035,b:s1-i*L*0.045,y:dy-th*(i+1)});
  const top=T[tiers-1],topY=top.y;
  const nF=D.funnels||(sh.grt>=12000?3:sh.grt>=8500?2:1),fw=15+sh.grt/1200,fh=40+sh.grt/700;
  const fx=[];for(let i=0;i<nF;i++)fx.push(top.a+(top.b-top.a)*((i+1)/(nF+1))+6);
  const mastH=topY-fh-26,fm=X(.84),am=X(.15);
  const cut=mode==='cut';
  const B=build||null,onSlip=B&&(B.stage==='framing'||B.stage==='plating'),inYard=sh.state==='yard'||onSlip||(B&&B.stage==='fitting');
  let s=`<svg class="profile" viewBox="0 0 ${VW} ${VH}" role="img" aria-label="${cut?'Cutaway':'Profile'} of SS ${sh.name}"><defs><clipPath id="${cid}"><path d="${hull}"/></clipPath></defs>`;
  s+=`<rect width="${VW}" height="${VH}" style="fill:${cut?'var(--surface2)':'var(--sky)'}"/>`;
  if(inYard&&!cut){s+=`<rect x="0" y="${bot}" width="${VW}" height="${VH-bot}" style="fill:var(--line)"/><rect x="${x0-30}" y="${bot-40}" width="8" height="${VH-bot+40}" style="fill:var(--muted)"/><rect x="${x0+L+22}" y="${bot-40}" width="8" height="${VH-bot+40}" style="fill:var(--muted)"/>`;
    for(let x=X(.1);x<X(.92);x+=40)s+=`<rect x="${x}" y="${bot}" width="14" height="8" style="fill:var(--muted)"/>`;}
  // masts and rigging
  const mc=cut?'var(--muted)':'#2B2E30';
  s+=`<g stroke="${mc}" fill="none"><line x1="${fm}" y1="${dy}" x2="${fm}" y2="${mastH}" stroke-width="2.2"/><line x1="${am}" y1="${dy}" x2="${am}" y2="${mastH+6}" stroke-width="2.2"/>
    <line x1="${fm}" y1="${mastH}" x2="${x0+L}" y2="${dy-7}" stroke-width=".7" opacity=".6"/><line x1="${am}" y1="${mastH+6}" x2="${x0+1}" y2="${dy}" stroke-width=".7" opacity=".6"/>
    ${sh.up&&sh.up.wireless?`<line x1="${fm}" y1="${mastH+2}" x2="${am}" y2="${mastH+8}" stroke-width=".6" opacity=".55"/>`:''}
    <line x1="${fm}" y1="${dy-18}" x2="${fm+22}" y2="${dy-4}" stroke-width="1.2"/><line x1="${am}" y1="${dy-18}" x2="${am-22}" y2="${dy-4}" stroke-width="1.2"/></g>`;
  if(B&&!cut&&(B.stage==='drawing'||B.stage==='waiting')){
    s+=`<g style="stroke:var(--muted);fill:none" stroke-dasharray="5 4"><path d="${hull}"/></g>`;
    s+=`<text x="${VW/2}" y="${VH-14}" text-anchor="middle" font-size="11" style="fill:var(--muted);font-family:var(--body)">${B.stage==='drawing'?'On the drawing board':'Waiting for a slip'}</text></svg>`;return s;}
  if(onSlip&&!cut){
    const pl=B.stage==='plating'?clamp((B.prog-0.3)/0.32,0,1):0;
    s+=`<g clip-path="url(#${cid})">`;for(let x=x0;x<x0+L;x+=7)s+=`<line x1="${x}" y1="${dy-10}" x2="${x}" y2="${bot+4}" style="stroke:#6B6258" stroke-width="1.3"/>`;
    s+=`<rect x="${x0-4}" y="${dy-10}" width="${(L+8)*pl}" height="${bot-dy+14}" style="fill:#3A3F42"/></g>`;
    s+=`<path d="${hull}" style="fill:none;stroke:#6B6258" stroke-width="1.2"/><line x1="${x0}" y1="${bot}" x2="${x0+L}" y2="${bot}" style="stroke:#6B6258" stroke-width="3"/>`;
    for(let x=x0-10;x<x0+L+20;x+=46)s+=`<line x1="${x}" y1="${bot}" x2="${x+30}" y2="${dy-40}" style="stroke:var(--muted)" stroke-width="1.5" opacity=".5"/>`;
    s+=`<line x1="${x0-24}" y1="${VH}" x2="${x0-24}" y2="12" style="stroke:var(--ink)" stroke-width="3"/><line x1="${x0-24}" y1="14" x2="${x0+L*0.45}" y2="14" style="stroke:var(--ink)" stroke-width="2"/>`;
    s+=`<text x="${VW/2}" y="${VH-4}" text-anchor="middle" font-size="11" style="fill:var(--muted);font-family:var(--body)">${B.stage==='framing'?'Framing on the slip':'Plating the hull'}, ${Math.round(B.prog*100)}%</text></svg>`;return s;}
  const fitP=B&&B.stage==='fitting'?clamp((B.prog-0.62)/0.38,0,1):1;
  if(!cut){
    // smoke
    const smoking=(sh.state==='sea'&&sh.stopLeft<=0)||sh.state==='port'||sh.state==='repo';
    if(smoking){const coal=sh.fuel==='coal',heavy=sh.limp,col=heavy?'#1c1c1c':coal?'#46494b':'#A8AEB1',n=sh.state==='port'?2:4;
      for(const cx of fx){const tx=cx-7,ty=topY-fh;s+=`<g class="smoke" style="fill:${col}">`;
        for(let i=0;i<n;i++)s+=`<circle cx="${tx-10-i*16}" cy="${ty-5-i*5}" r="${(heavy?7:5)+i*2.2}" opacity="${(coal?0.55:0.35)-i*0.1}"/>`;s+='</g>';
        if(heavy)s+=`<circle cx="${tx}" cy="${ty+2}" r="4" style="fill:#E0632F" opacity=".8"/>`;}}
    // hull
    s+=`<path d="${hull}" style="fill:#1C2226"/>`;
    s+=`<g clip-path="url(#${cid})"><rect x="${x0-5}" y="${inYard?wl-4:wl-4}" width="${L+10}" height="${inYard?30:8}" style="fill:#9C2F22"/></g>`;
    s+=`<line x1="${x0+4}" y1="${dy+3}" x2="${X(.97)}" y2="${dy-2}" stroke="#D9D2C0" stroke-width=".8" opacity=".6"/>`;
    s+=`<rect x="${X(.86)}" y="${dy-11}" width="${L*0.11}" height="7" style="fill:#1C2226"/><rect x="${x0+3}" y="${dy-6}" width="${L*0.09}" height="6" style="fill:#1C2226"/>`;
    for(let row=0;row<2;row++)for(let x=X(.06);x<X(.92);x+=8)s+=`<circle cx="${x}" cy="${dy+9+row*8}" r="1.1" style="fill:#D8D0B8" opacity=".8"/>`;
    // superstructure
    T.forEach((t,i)=>{if(fitP<(i+1)/(tiers+1))return;s+=`<rect x="${t.a}" y="${t.y}" width="${t.b-t.a}" height="${th}" style="fill:#EFECE4;stroke:#BDB6A6" stroke-width=".6"/>`;
      for(let x=t.a+4;x<t.b-4;x+=7)s+=`<rect x="${x}" y="${t.y+3.5}" width="3" height="3.6" style="fill:#3A4650"/>`;});
    s+=`<rect x="${top.b-24}" y="${topY-9}" width="28" height="9" style="fill:#EFECE4;stroke:#BDB6A6" stroke-width=".6"/>`;
    for(let x=top.b-21;x<top.b+2;x+=5)s+=`<rect x="${x}" y="${topY-7}" width="3" height="3" style="fill:#3A4650"/>`;
    for(let x=top.a+8;x<top.b-34;x+=22)s+=`<ellipse cx="${x}" cy="${topY-3}" rx="8" ry="2.6" style="fill:#F5F3EE;stroke:#9A9A9A" stroke-width=".5"/>`;
    // funnels
    for(const cx of (fitP>0.8?fx:[])){const b=cx-fw/2,e=cx+fw/2,tb=topY-fh,rk=7;
      const at=(h)=>-rk*h;
      s+=`<polygon points="${b},${topY} ${e},${topY} ${e+at(1)},${tb} ${b+at(1)},${tb}" style="fill:#C79A4E"/>`;
      const y1=topY-fh*.55,y2=topY-fh*.68;s+=`<polygon points="${b+at(.55)},${y1} ${e+at(.55)},${y1} ${e+at(.68)},${y2} ${b+at(.68)},${y2}" style="fill:#1B4757"/>`;
      const y3=topY-fh*.82;s+=`<polygon points="${b+at(.82)},${y3} ${e+at(.82)},${y3} ${e+at(1)},${tb} ${b+at(1)},${tb}" style="fill:#15181A"/>`;}
    // rust
    const R=seed(sh.id*7919+3),nr=Math.max(0,Math.round((85-sh.cond)/5));
    for(let i=0;i<nr;i++){const x=X(.05+R()*.9),y=dy+1+R()*6,l=5+R()*16;s+=`<line x1="${x}" y1="${y}" x2="${x+0.5}" y2="${y+l}" stroke="#8A4A26" stroke-width="1.4" opacity=".6"/>`;}
    if(sh.cond<50)for(let i=0;i<nr/2;i++){const t=T[Math.floor(R()*tiers)],x=t.a+R()*(t.b-t.a);s+=`<line x1="${x}" y1="${t.y+2}" x2="${x}" y2="${t.y+4+R()*7}" stroke="#8A4A26" stroke-width="1.2" opacity=".5"/>`;}
    s+=`<text x="${X(.93)}" y="${dy+6}" font-size="6" letter-spacing="1" text-anchor="end" style="fill:#D9D2C0;font-family:var(--body)">${sh.name.toUpperCase()}</text>`;
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
  T.forEach(t=>{const o=occ('f');s+=`<rect x="${t.a}" y="${t.y}" width="${t.b-t.a}" height="${th}" style="fill:var(--line);stroke:var(--muted)" stroke-width=".5" opacity=".6"/><rect x="${t.a}" y="${t.y}" width="${(t.b-t.a)*o}" height="${th}" style="fill:${CL_COL.f}" opacity=".85"/>`;});
  s+=reg(.33,.62,B1[0],B1[1],CL_COL.f,occ('f'),true);
  s+=reg(.05,.33,B1[0],B1[1],CL_COL.s,occ('s'),true);
  s+=reg(.62,.95,B1[0],B1[1],CL_COL.t,occ('t'),true);
  s+=reg(.62,.93,B2[0],B2[1],CL_COL.t,occ('t'),true);
  s+=sh.berths.tt?reg(.06,.33,B2[0],B2[1],CL_COL.tt,occ('tt'),true):reg(.06,.33,B2[0],B2[1],CL_COL.t,occ('t'),true);
  s+=`<g clip-path="url(#${cid})"><rect x="${X(.36)}" y="${B2[0]}" width="${L*.24}" height="${bot-B2[0]}" style="fill:var(--muted)" opacity=".45"/>
    <rect x="${X(.33)}" y="${B2[0]}" width="${L*.03}" height="${bot-B2[0]}" style="fill:${sh.fuel==='coal'?'#2A2A2A':'#A8742A'}" opacity=".8"/>
    <rect x="${X(.60)}" y="${B2[0]}" width="${L*.03}" height="${bot-B2[0]}" style="fill:${sh.fuel==='coal'?'#2A2A2A':'#A8742A'}" opacity=".8"/></g>`;
  s+=reg(.08,.33,B3[0],B3[1],'#8A6A45',cargoOcc,true)+reg(.63,.94,B3[0],B3[1],'#8A6A45',cargoOcc,true);
  s+=`<g clip-path="url(#${cid})" stroke="var(--ink)" stroke-width=".6" opacity=".7"><line x1="${x0}" y1="${B1[1]}" x2="${x0+L}" y2="${B1[1]}"/><line x1="${x0}" y1="${B2[1]}" x2="${x0+L}" y2="${B2[1]}"/></g>`;
  s+=`<line x1="0" y1="${wl}" x2="${VW}" y2="${wl}" style="stroke:var(--muted)" stroke-dasharray="4 4"/>`;
  for(const cx of fx){const b=cx-fw/2,e=cx+fw/2;s+=`<polygon points="${b},${topY} ${e},${topY} ${e-7},${topY-fh} ${b-7},${topY-fh}" style="fill:none;stroke:var(--muted)"/>`;}
  s+='</svg>';return s;
}
function legendHTML(sh){
  const src=sh.load||sh.lastLoad;
  const it=CL.filter(c=>sh.berths[c]).map(c=>`<span><i style="background:${CL_COL[c]}"></i>${CL_NAME[c]} ${src&&src.pax[c]?int(src.pax[c].n):0} of ${sh.berths[c]}</span>`);
  it.push(`<span><i style="background:#8A6A45"></i>Cargo ${src?int(src.cargoT):0} of ${int(sh.cargo)} t</span>`);
  it.push(`<span><i style="background:var(--muted)"></i>Engines, ${sh.fuel==='coal'?'coal bunkers':'oil tanks'}</span>`);
  return `<div class="legend">${it.join('')}</div><p class="note">${sh.load?'Current crossing':sh.lastLoad?'Last crossing':'No crossings yet'}.</p>`;
}
