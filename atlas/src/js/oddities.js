// ── oddities.js ───────────────────────────────────────────────
// Oddities tab: category chips, renderOddMap, renderOddList.

const ODD_CATS={vulgar:'#b34a2c',dark:'#4a3a5a',rogue:'#8a7224',animal:'#6b8e4e',household:'#4a7c8a',stinky:'#7a6548'};
const oddState={};
let oddLayerOnMap=null;
let oddMarkersByName={}; // {name: [{marker, color},...]} for hover-highlight

// Build category chips
const oddChipWrap=document.getElementById('odd-chips');
Object.entries(ODD_CATS).forEach(([cat,col])=>{
  const chip=document.createElement('button');chip.className='chip';chip.dataset.cat=cat;
  chip.dataset.i='odd_'+cat;chip.textContent=t('odd_'+cat);
  oddState[cat]={on:false,color:col};
  chip.addEventListener('click',()=>{
    const st=oddState[cat];
    if(st.on){st.on=false;chip.classList.remove('on');chip.style.cssText='';}
    else{st.on=true;chip.classList.add('on');chip.style.background=st.color;chip.style.color='#fff';}
    renderOddMap();
    renderOddList();
  });
  oddChipWrap.appendChild(chip);
});

function oddHighlight(name){
  Object.entries(oddMarkersByName).forEach(([n,arr])=>{
    const dim=name&&n!==name;
    arr.forEach(({marker:m,color:col})=>{
      if(dim) m.setStyle({fillColor:'#bdb6a8',fillOpacity:.25,color:'#fff',weight:1});
      else{m.setStyle({fillColor:col,fillOpacity:.9,color:'#fff',weight:1.5});if(name===n&&m.bringToFront)m.bringToFront();}
    });
  });
}
function renderOddMap(){
  if(oddLayerOnMap){map.removeLayer(oddLayerOnMap);oddLayerOnMap=null;}
  oddMarkersByName={};
  const activeCats=Object.entries(oddState).filter(([,s])=>s.on).map(([c])=>c);
  if(!activeCats.length) return;
  const lg=L.layerGroup();
  ODD.filter(item=>activeCats.includes(item.cat)).forEach(item=>{
    const col=ODD_CATS[item.cat];
    item.points.forEach(p=>{
      if(!passesFilter(p)) return;
      const m=L.circleMarker([p.lat,p.lon],{radius:7,fillColor:col,color:'#fff',weight:1.5,fillOpacity:0.9});
      m.on('click',()=>m.setPopupContent(
        `<span class="pb">${esc(item.name)}</span><br>`+
        `<span class="pt" style="font-style:italic">${esc(lang==='gr'?item.gloss_gr:item.gloss)}</span><br>`+
        `<span class="pt">${esc(tType(p.type))}</span>`
      ));
      m.bindPopup('');lg.addLayer(m);
      (oddMarkersByName[item.name]=oddMarkersByName[item.name]||[]).push({marker:m,color:col});
    });
  });
  oddLayerOnMap=lg;
  if(document.querySelector('.tab.on').dataset.tab==='odd') lg.addTo(map);
}

function renderOddList(){
  const list=document.getElementById('odd-list');
  const activeCats=Object.entries(oddState).filter(([,s])=>s.on).map(([c])=>c);
  if(!activeCats.length){list.innerHTML='';return;}
  const items=ODD.filter(i=>activeCats.includes(i.cat));
  list.innerHTML='';
  items.forEach(i=>{
    const col=ODD_CATS[i.cat];
    const gloss=lang==='gr'?i.gloss_gr:i.gloss;
    const row=document.createElement('div');
    row.className='odd-row';
    row.innerHTML=`<span class="odd-dot" style="background:${col}"></span>
      <span class="odd-name">${esc(i.name)}</span>
      ${lang!=='gr'?`<span class="odd-gloss">${esc(gloss)}</span>`:''}
      <span class="odd-count">${i.count>1?i.count+'×':''}</span>`;
    row.addEventListener('mouseenter',()=>{row.style.background='var(--rule)';oddHighlight(i.name);});
    row.addEventListener('mouseleave',()=>{row.style.background='';oddHighlight(null);});
    list.appendChild(row);
  });
}
