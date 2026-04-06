// ── poly.js ───────────────────────────────────────────────────
// Polymorphism tab: dropdown build, change handler, polyLayerOnMap.

function typeColor(typeKey){return TYPE_COLORS[typeKey]||'#6b5b73';}

let polyLayerOnMap=null;
let polyMarkersByType={}; // {typeKey: [marker,...]} for hover-highlight
const polySelect=document.getElementById('poly-sel'),polyDetail=document.getElementById('poly-detail');
Object.entries(POLY).sort((a,b)=>b[1].score-a[1].score).forEach(([name,info])=>{
  const opt=document.createElement('option');opt.value=name;
  opt.textContent=`${name} (${info.n_types} ${lang==='gr'?'τύποι':'types'} · ${Math.round(info.norm_entropy*100)}%)`;
  polySelect.appendChild(opt);});

function polyHighlight(t){
  Object.entries(polyMarkersByType).forEach(([k,arr])=>{
    const dim=t&&k!==t;
    arr.forEach(m=>{
      if(dim){m.setStyle({fillColor:'#bdb6a8',fillOpacity:.35,color:'#fff',weight:1});
        if(m._path) m._path.style.zIndex='0';}
      else{m.setStyle({fillColor:typeColor(k),fillOpacity:.88,color:'#fff',weight:1.5});
        if(t===k&&m.bringToFront) m.bringToFront();}
    });
  });
}
polySelect.addEventListener('change',()=>{
  if(polyLayerOnMap){map.removeLayer(polyLayerOnMap);polyLayerOnMap=null;}polyDetail.innerHTML='';
  polyMarkersByType={};
  const name=polySelect.value;if(!name) return;const info=POLY[name];const lg=L.layerGroup();
  info.points.forEach(p=>{
    if(!passesFilter(p)) return;
    const m=L.circleMarker([p.lat,p.lon],{radius:6,fillColor:typeColor(p.type),color:'#fff',weight:1.5,fillOpacity:0.88});
    m.bindTooltip(tType(p.type),{permanent:false,direction:'top',className:'type-tip'});
    m.bindPopup(`<span class="pb">${esc(name)}</span> → <b>${esc(tType(p.type))}</b>`);lg.addLayer(m);
    (polyMarkersByType[p.type]=polyMarkersByType[p.type]||[]).push(m);});
  polyLayerOnMap=lg;
  if(document.querySelector('.tab.on').dataset.tab==='poly') lg.addTo(map);
  // Build type list from actual markers (not info.types) so only types with visible points appear
  const visibleTypes=Object.keys(polyMarkersByType).length;
  const visibleCount=Object.values(polyMarkersByType).reduce((s,a)=>s+a.length,0);
  const tl=Object.entries(polyMarkersByType).sort((a,b)=>b[1].length-a[1].length)
    .map(([tp,arr])=>`<span class="trow" data-ptype="${esc(tp)}"><span class="tdot" style="background:${typeColor(tp)}"></span>${esc(tType(tp))}: ${arr.length}×</span>`).join('<br>');
  polyDetail.innerHTML=`<b>${visibleTypes} ${lang==='gr'?'τύποι':'types'} · ${visibleCount} ${lang==='gr'?'εμφανίσεις':'occurrences'} · ${lang==='gr'?'διασπορά':'spread'} ${Math.round(info.norm_entropy*100)}%</b><br><br>`+tl;
  polyDetail.querySelectorAll('.trow').forEach(row=>{
    row.addEventListener('mouseenter',()=>polyHighlight(row.dataset.ptype));
    row.addEventListener('mouseleave',()=>polyHighlight(null));
  });
  if(info.points.length>0) map.fitBounds(L.latLngBounds(info.points.map(p=>[p.lat,p.lon])).pad(0.15));
});
