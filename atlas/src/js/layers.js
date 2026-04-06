// ── layers.js ─────────────────────────────────────────────────
// Hex layer system: hexProfilePopup, makeHL, LAYER_DEFS registry,
// lazy _layerCache, getLayer(), invalidateLayerCache().

function hexProfilePopup(centerLat,centerLon,n){
  const key=`${Math.round(centerLat*10000)/10000},${Math.round(centerLon*10000)/10000}`;
  const profileEntry=PROFILES[key];
  if(!profileEntry) return '';
  const profile=profileEntry[FILTER];
  if(!profile) return '';
  const wc=profile.wc;
  if(!wc||wc.length===0) return '';
  const words=wc.map(([name])=>{
    const cat=classifyName(name);
    const col=cat?SEM_COLORS[cat]:null;
    const dot=col?`<span class="wc-dot" style="background:${col}"></span>`
                 :`<span class="wc-dot wc-dot-hollow"></span>`;
    return `<span class="wc-word">${dot}${esc(name)}</span>`;
  }).join('');
  const sc=profile.sc;
  const total=Object.values(sc).reduce((a,b)=>a+b,0);
  const semBars=Object.entries(sc).filter(([k])=>k!=='opaque').sort((a,b)=>b[1]-a[1]).slice(0,6).map(([k,v])=>
    `<div class="sem-bar"><span class="sem-bar-label">${esc(semLabel(k))}</span><div class="sem-bar-track"><div class="sem-bar-fill" style="width:${Math.round(100*v/total)}%;background:${SEM_COLORS[k]||'#ccc'}"></div></div></div>`
  ).join('');
  return `<div class="hex-profile"><div class="wc-wrap">${words}</div><h4 style="margin-top:8px">${t('hp_sem')}</h4><div class="sem-bars">${semBars}</div></div>`;
}

function makeHL(data,colorFn,tipFn){
  const lg=L.layerGroup();
  data.forEach(h=>{
    const d=h[FILTER]; if(!d) return;
    const col=colorFn(d,h); if(col===null) return;
    const poly=L.polygon(h.b.map(p=>[p[0],p[1]]),{
      fillColor:col,fillOpacity:0.72,weight:0.3,color:'#fff',opacity:0.5});
    poly._hd=d; poly._origColor=col;
    poly.bindPopup(()=>tipFn(d,h),{maxWidth:340});
    lg.addLayer(poly);
  });
  return lg;
}

// ── LAYER DEFINITIONS ─────────────────────────────────────────
// Single authoritative registry — color and tooltip defined once per layer.
const LAYER_DEFS={
  ent:{
    data:()=>ENT,
    // d.hr = normalised entropy ratio [0,1]; stretch [0.92,1.0] to full viridis scale
    color:d=>viridis(Math.max(0,(d.hr-0.92)/0.08)),
    tip:(d,h)=>{const c=h.c||[0,0]; let s=`<span class="pb">${esc(t('p_div_h'))}: ${esc(translateLabel(d.lbl))}</span><br>`;
      if(d.u!==d.n) s+=`<span class="pt">${d.u} ${esc(t('p_unique'))} ${d.n} ${esc(t('p_features'))}<br>`;
      else s+=`<span class="pt">${d.n} ${esc(t('p_features'))}<br>`;
      s+=`${Math.round(d.hr*100)}% ${esc(t('p_unique_pct'))}</span>`;
      return s+hexProfilePopup(c[0],c[1],d.n);}
  },
  sem:{
    data:()=>SEM,
    color:d=>SEM_COLORS[d.d]||'#ccc',
    tip:(d,h)=>{const c=h.c||[0,0];const nUncl=Math.round(d.op*d.n/100);
      const pn=t('p_names');
      return `<span class="pb">${esc(t('p_mainly'))} ${esc(semLabel(d.d))}${pn?' '+esc(pn):''}</span><br>`+
      `<span class="pt">${d.n} ${esc(t('p_ftotal'))}${nUncl>0?' · '+nUncl+' '+esc(t('p_unclear')):''}</span>`+
      hexProfilePopup(c[0],c[1],d.n);}
  },
  sem_ent:{
    data:()=>SEM,
    // skip opaque-dominant hexes (d=opaque, or >80% of names are opaque = too little signal)
    // he normalised 0-1; p95=0.80 → stretch to full scale
    // Aegean sequential: parchment → warm olive → deep teal (mono → multi-thematic)
    // Distribution of he (after filter op≤80): p25=0.66, p50=0.73, p75=0.78, p90=0.82, p95=0.85
    // Stretch [0.55,0.85] → [0,1] to expose the meaningful variation
    color:d=>{
      if(d.d==='opaque'||d.op>80) return null;
      const ratio=Math.max(0,Math.min((d.he-0.55)/0.30,1));
      if(ratio<0.5){const u=ratio/0.5;return seqColor(u,244,241,234,176,154,88);}
      const u=(ratio-0.5)/0.5;return seqColor(u,176,154,88,38,72,86);
    },
    tip:(d,h)=>{const c=h.c||[0,0];const pn=t('p_names');
      return `<span class="pb">${esc(t('l_sem_ent'))}: ${Math.round(d.he*100)}%</span><br>`+
      `<span class="pt">${esc(t('p_mainly'))} ${esc(semLabel(d.d))}${pn?' '+esc(pn):''} (${d.dp}%)<br>${d.n} ${esc(t('p_ftotal'))}</span>`+
      hexProfilePopup(c[0],c[1],d.n);}
  },
  pfx_all:{
    data:()=>PREFIX,
    color:d=>seqColor(Math.sqrt(Math.min(d.all/d.nu*100/60,1)),228,218,200,30,58,95),
    tip:(d)=>{const names=[];
      const M=[['Νέο',d.tn],['Παλαιό',d.tp],['Άνω',d.ta],['Κάτω',d.tk],['Μεγάλο',d.tm],['Μικρό',d.tmi]];
      M.forEach(([lbl,arr])=>{if(arr&&arr.length) arr.forEach(n=>names.push(`<b>${esc(lbl)}</b> → ${esc(n)}`));});
      return `<span class="pb">${d.all} ${esc(t('p_mod_names'))}</span><br><span class="pt">${names.join('<br>')||'—'}</span>`;}
  },
  pfx_neo:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.neo/d.nu*100/20,1)),228,218,200,179,74,44),tip:(d)=>`<span class="pb">Νέο · ${d.neo}</span><br><span class="pt">${d.tn.map(esc).join('<br>')||'—'}</span>`},
  pfx_pal:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.pal/d.nu*100/20,1)),228,218,200,142,90,68),tip:(d)=>`<span class="pb">Παλαιό · ${d.pal}</span><br><span class="pt">${d.tp.map(esc).join('<br>')||'—'}</span>`},
  pfx_ano:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.ano/d.nu*100/20,1)),228,218,200,107,142,78),tip:(d)=>`<span class="pb">Άνω · ${d.ano}</span><br><span class="pt">${d.ta.map(esc).join('<br>')||'—'}</span>`},
  pfx_kat:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.kat/d.nu*100/20,1)),228,218,200,74,124,138),tip:(d)=>`<span class="pb">Κάτω · ${d.kat}</span><br><span class="pt">${d.tk.map(esc).join('<br>')||'—'}</span>`},
  pfx_meg:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.meg/d.nu*100/20,1)),228,218,200,122,101,72),tip:(d)=>`<span class="pb">Μεγάλο · ${d.meg}</span><br><span class="pt">${d.tm.map(esc).join('<br>')||'—'}</span>`},
  pfx_mik:{data:()=>PREFIX,color:d=>seqColor(Math.sqrt(Math.min(d.mik/d.nu*100/20,1)),228,218,200,107,91,115),tip:(d)=>`<span class="pb">Μικρό · ${d.mik}</span><br><span class="pt">${d.tmi.map(esc).join('<br>')||'—'}</span>`},
  etym_div:{
    data:()=>ETYM,
    // parchment → warm taupe (non-categorical, gentle — max non-Greek ~30%)
    color:d=>seqColor(Math.min((100-d.gk)/30,1),244,241,234,138,118,90),
    tip:(d)=>{const segs=[{l:'Greek',v:d.gk},{l:'Turkish/Ottoman',v:d.tk},
      {l:'Slavic',v:d.sl},{l:'Mixed/Compound',v:d.mx},{l:'Venetian/Italian',v:d.vn},
      {l:'Albanian',v:d.al},{l:'Unknown',v:d.un}].filter(s=>s.v>0).map(s=>({...s,c:ETYM_COLORS[s.l]}));
      const bars=segs.map(s=>`<div class="bar-seg" style="width:${s.v}%;background:${s.c};"></div>`).join('');
      const bd=segs.map(s=>`<span style="color:${s.c}">■</span> ${esc(tEtym(s.l))}: ${s.v}%`).join(' ');
      const nOrig=segs.length;
      return `<span class="pb">${nOrig} ${t('p_norigins')}</span><br>`+
        `<div class="bar-wrap">${bars}</div><span class="pt">${bd}<br>${d.n} ${t('p_ftotal')}${formatNonGreek(d.ngl)}</span>`;}
  }
};

// ── LAZY LAYER CACHE ──────────────────────────────────────────
// Layers are built on first access; invalidated when FILTER changes.
const _layerCache={};
function getLayer(id){
  if(!_layerCache[id]){
    const def=LAYER_DEFS[id];
    _layerCache[id]=makeHL(def.data(),def.color,def.tip);
  }
  return _layerCache[id];
}
function getLayerIfBuilt(id){ return _layerCache[id]||null; }
function invalidateLayerCache(){
  Object.keys(_layerCache).forEach(k=>{
    if(map.hasLayer(_layerCache[k])) map.removeLayer(_layerCache[k]);
    delete _layerCache[k];
  });
}
