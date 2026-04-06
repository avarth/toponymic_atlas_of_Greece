// ── charts.js ─────────────────────────────────────────────────
// Semantic legend DOM setup, sidebar bar charts, updateSemLeg.

// Build the semantic category legend (uses SEM_COLORS, SEM_LABELS from constants.js)
const semLeg=document.getElementById('sem-leg');
['religious','anthroponym','geomorphic','flora','fauna','hydro','built','transport','colour','ethnic'].forEach(c=>{
  const sp=document.createElement('span');sp.className='li';
  sp.innerHTML=`<span class="ldot" style="background:${SEM_COLORS[c]}"></span><span data-sem-leg="${c}">${SEM_LABELS[c]}</span>`;
  semLeg.appendChild(sp);
});
function updateSemLeg(){
  document.querySelectorAll('[data-sem-leg]').forEach(el=>{el.textContent=semLabel(el.dataset.semLeg);});
}

function makeBarChart(container, title, items, maxVal, colorFn){
  let html=`<div class="chart-title">${esc(title)}</div>`;
  items.forEach(([label,val,key])=>{
    const pct=Math.round(100*val/maxVal);
    const col=typeof colorFn==='function'?colorFn(label):'var(--blue)';
    html+=`<div class="hbar"${key?' data-hkey="'+esc(key)+'"':''}><span class="hbar-label">${esc(label)}</span>`+
      `<div class="hbar-track"><div class="hbar-fill" style="width:${pct}%;background:${col}"></div></div>`+
      `<span class="hbar-val">${val>999?(val/1000).toFixed(1)+'k':val}</span></div>`;
  });
  container.innerHTML=html;
}

function buildCharts(){
  const C=CHARTS[FILTER];
  const semItems=Object.entries(C.sem).filter(([k])=>k!=='opaque').map(([k,v])=>[semLabel(k),v,k]);
  const semMax=Math.max(...semItems.map(x=>x[1]));
  makeBarChart(document.getElementById('chart-sem'),t('ct_sem'),semItems,semMax,l=>{
    const key=Object.keys(SEM_LABELS).find(k=>SEM_LABELS[k]===l||SEM_LABELS_GR[k]===l); return SEM_COLORS[key]||'#999';});
  const opaqueN=C.sem.opaque||0;
  const totalN=Object.values(C.sem).reduce((a,b)=>a+b,0);
  const opaqueP=totalN?Math.round(100*opaqueN/totalN):0;
  const semEl=document.getElementById('chart-sem');
  const note=document.createElement('div');note.className='chart-note';
  note.textContent=lang==='gr'?`${opaqueN.toLocaleString()} ονόματα με ασαφή σημασία (${opaqueP}%)`
    :`${opaqueN.toLocaleString()} names with unclear meaning (${opaqueP}%)`;
  semEl.appendChild(note);
  const hint=document.createElement('div');hint.className='chart-hint';
  hint.textContent=lang==='gr'?'πέρνα πάνω από κατηγορία για απομόνωση':'hover over category to isolate';
  semEl.appendChild(hint);
  const nameItems=C.top_names.map(([n,c])=>[n,c]);
  makeBarChart(document.getElementById('chart-topnames'),t('ct_top'),nameItems,nameItems[0][1],l=>SEM_COLORS[classifyName(l)||'anthroponym']);
  const modItems=Object.entries(C.mod_counts);
  const modMax=Math.max(...modItems.map(x=>x[1]));
  makeBarChart(document.getElementById('chart-mods'),t('ct_mods'),modItems,modMax,()=>'var(--blue)');
  const etymItems=Object.entries(C.etym).map(([k,v])=>[tEtym(k),v,k]);
  const etymMax=etymItems[0][1];
  makeBarChart(document.getElementById('chart-etym'),t('ct_etym'),etymItems,etymMax,l=>ETYM_COLORS[l]||'#999');
  const etymHint=document.createElement('div');etymHint.className='chart-hint';
  etymHint.textContent=lang==='gr'?'πέρνα πάνω από κατηγορία για απομόνωση':'hover over category to isolate';
  document.getElementById('chart-etym').appendChild(etymHint);
  updateSemLeg();
  wireChartHover();
}

// ── HOVER HIGHLIGHT ───────────────────────────────────────────
// Sem bars → isolate hexes of that dominant category on sem layer
// Etym bars → highlight hexes containing that linguistic origin

function hexHighlightSem(catKey){
  const layer=getLayerIfBuilt('sem'); if(!layer) return;
  layer.eachLayer(p=>{
    if(!p._hd) return;
    if(catKey){
      if(p._hd.d===catKey) p.setStyle({fillColor:p._origColor,fillOpacity:0.82});
      else p.setStyle({fillColor:'#d4d0c6',fillOpacity:0.25});
    } else {
      p.setStyle({fillColor:p._origColor,fillOpacity:0.72});
    }
  });
}
function hexHighlightEtym(etymKey){
  const layer=getLayerIfBuilt('etym_div'); if(!layer) return;
  const dk=ETYM_KEY_MAP[etymKey];
  const col=ETYM_COLORS[etymKey];
  layer.eachLayer(p=>{
    if(!p._hd) return;
    if(etymKey){
      const val=p._hd[dk]||0;
      if(val>0) p.setStyle({fillColor:col,fillOpacity:Math.max(0.3,val/100)});
      else p.setStyle({fillColor:'#d4d0c6',fillOpacity:0.18});
    } else {
      p.setStyle({fillColor:p._origColor,fillOpacity:0.72});
    }
  });
}
function wireChartHover(){
  document.querySelectorAll('#chart-sem .hbar[data-hkey]').forEach(bar=>{
    bar.style.cursor='default';
    bar.addEventListener('mouseenter',()=>{if(activeLayer==='sem') hexHighlightSem(bar.dataset.hkey);});
    bar.addEventListener('mouseleave',()=>{if(activeLayer==='sem') hexHighlightSem(null);});
  });
  document.querySelectorAll('#chart-etym .hbar[data-hkey]').forEach(bar=>{
    bar.style.cursor='default';
    bar.addEventListener('mouseenter',()=>{if(activeLayer==='etym_div') hexHighlightEtym(bar.dataset.hkey);});
    bar.addEventListener('mouseleave',()=>{if(activeLayer==='etym_div') hexHighlightEtym(null);});
  });
}
