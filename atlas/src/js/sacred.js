// ── sacred.js ─────────────────────────────────────────────────
// Sacred Names tab: chip/DOM build from HAGIO data, rebuildSacredLayers.

// Aegean earth tones — desaturated, harmonised with SEM_COLORS palette
const SCOLS=['#1e3a5f','#b34a2c','#6b8e4e','#7a6548','#4a7c8a','#8e5a44','#6b5b73','#c17a3c','#5f6b3a','#9c8856',
  '#4a3a5a','#2f5d6b','#8a4a38','#5a7348','#a8754a','#3a4d6b','#7a4a5c','#556b3c','#9a6b48','#3c5260',
  '#6b4a38','#4a6548','#8a6a3c','#5a4858','#3c6878','#7a5a2c','#4a5548','#6a3838','#5a7a5a','#8a5c4c',
  '#3a4a3c','#5a4048','#6e5838','#2c4858','#7c5848','#485a6b','#5f4a4a','#8a7a5a','#4a6a5c','#6c4a6a'];
const sacredState={};let colorIndex=0;
const CAT_ORDER=['saints','theotokos','prophets','archangels','feasts','structures','other_religious'];
const sacredWrap=document.getElementById('sacred-groups');
CAT_ORDER.forEach(cat=>{
  if(!HAGIO[cat]) return;
  const names=HAGIO[cat];
  const total=Object.values(names).reduce((s,v)=>s+v.count,0);
  const hdr=document.createElement('div');hdr.className='cat-hdr';
  hdr.innerHTML=`<span class="cat-arrow">▼</span> <span data-i="cat_${cat}">${t('cat_'+cat)}</span><span class="cat-count">${total}</span>`;
  const wrap=document.createElement('div');wrap.className='chip-wrap';wrap.style.display='none';
  hdr.classList.add('collapsed');
  hdr.addEventListener('click',()=>{
    hdr.classList.toggle('collapsed');wrap.style.display=hdr.classList.contains('collapsed')?'none':'flex';});
  sacredWrap.appendChild(hdr);sacredWrap.appendChild(wrap);
  Object.entries(names).sort((a,b)=>b[1].count-a[1].count).forEach(([name,info])=>{
    const col=SCOLS[colorIndex%SCOLS.length];colorIndex++;
    const lg=L.layerGroup();
    info.points.forEach(p=>{
      const m=L.circleMarker([p.lat,p.lon],{radius:4,fillColor:col,color:'#fff',weight:1,fillOpacity:0.85});
      m.on('click',()=>m.setPopupContent(`<span class="pb">${esc(name)}</span><br><span class="pt">${esc(tType(p.type))}</span>`));
      m.bindPopup('');lg.addLayer(m);});
    sacredState[name]={layer:lg,color:col,on:false};
    const chip=document.createElement('button');chip.className='chip';chip.dataset.name=name;
    const short=name.replace('Άγιος ','Αγ. ').replace('Αγία ','Αγ. ').replace('Προφήτης ','Πρ. ').replace('Άγιοι ','Αγ. ');
    chip.innerHTML=`${esc(short)}<span class="cn">${info.count}</span>`;
    chip.addEventListener('click',()=>{
      const st=sacredState[name];
      if(st.on){map.removeLayer(st.layer);st.on=false;chip.classList.remove('on');chip.style.cssText='';}
      else{st.layer.addTo(map);st.on=true;chip.classList.add('on');chip.style.background=st.color;chip.style.color='#fff';}
    });
    wrap.appendChild(chip);
  });
});

function rebuildSacredLayers(){
  Object.entries(sacredState).forEach(([name,st])=>{
    if(st.on) map.removeLayer(st.layer);
    const lg=L.layerGroup();
    const cat=Object.keys(HAGIO).find(c=>HAGIO[c][name]);
    if(!cat) return;
    const info=HAGIO[cat][name];
    const col=st.color;
    info.points.forEach(p=>{
      if(!passesFilter(p)) return;
      const m=L.circleMarker([p.lat,p.lon],{radius:4,fillColor:col,color:'#fff',weight:1,fillOpacity:0.85});
      m.on('click',()=>m.setPopupContent(`<span class="pb">${esc(name)}</span><br><span class="pt">${esc(tType(p.type))}</span>`));
      m.bindPopup('');lg.addLayer(m);
    });
    st.layer=lg;
    const onSaints=(document.querySelector('.tab.on')?.dataset.tab)==='saints';
    if(st.on&&onSaints) lg.addTo(map);
  });
}
