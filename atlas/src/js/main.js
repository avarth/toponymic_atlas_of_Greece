// ── main.js ───────────────────────────────────────────────────
// Map initialisation, layer/filter/tab event wiring, startup sequence.

// ── INFO MODAL ────────────────────────────────────────────────
const infoOverlay=document.getElementById('info-overlay');
const infoBody=document.getElementById('info-body');
document.getElementById('info-btn').addEventListener('click',()=>{
  infoBody.innerHTML=buildInfoContent();
  infoOverlay.classList.add('open');
});
document.getElementById('info-close').addEventListener('click',()=>infoOverlay.classList.remove('open'));
infoOverlay.addEventListener('click',e=>{if(e.target===infoOverlay) infoOverlay.classList.remove('open');});

// ── MAP ───────────────────────────────────────────────────────
const greeceBounds=L.latLngBounds([33.5,18.5],[43.5,30.5]);
const map=L.map('map',{center:[38.5,24.0],zoom:7,zoomControl:true,
  maxBounds:greeceBounds.pad(0.15),maxBoundsViscosity:0.8,minZoom:5,maxZoom:16});
const tileVoyager=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
  {attribution:'© OSM © CARTO',maxZoom:18});
const tileLight=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
  {attribution:'© OSM © CARTO',maxZoom:18});
const tileDark=L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  {attribution:'© OSM © CARTO',maxZoom:18});
const tileTopo=L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
  {attribution:'© OSM © OpenTopoMap',maxZoom:17});
const tileLabels=L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
  {attribution:'',maxZoom:18,pane:'shadowPane'});
tileVoyager.addTo(map);
tileLabels.addTo(map);
L.control.layers({'Aegean':tileVoyager,'Light':tileLight,'Dark':tileDark,'Terrain':tileTopo},{},{position:'topright'}).addTo(map);
L.control.scale({imperial:false,position:'bottomright'}).addTo(map);

// ── INITIAL LAYER ─────────────────────────────────────────────
let activeLayer='sem';
getLayer('sem').addTo(map);
buildCharts();

// ── FILTER TOGGLE ─────────────────────────────────────────────
const TAB_DEFAULT_LAYER={maps:'sem',modif:'pfx_all',etym:'etym_div',saints:null,poly:null,odd:null};

function rebuildActiveLayer(){
  invalidateLayerCache();
  const curTab=document.querySelector('.tab.on')?.dataset.tab||'maps';
  if(TAB_DEFAULT_LAYER[curTab]) getLayer(activeLayer).addTo(map);
  buildCharts();
  rebuildSacredLayers();
  if(curTab==='odd'){renderOddMap();renderOddList();}
}

document.querySelectorAll('.fbtn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const f=btn.dataset.filter; if(f===FILTER) return;
    FILTER=f;
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    rebuildActiveLayer();
    // Re-trigger poly dropdown to rebuild with new filter
    if(document.getElementById('poly-sel').value) document.getElementById('poly-sel').dispatchEvent(new Event('change'));
  });
});

document.querySelectorAll('.lcard').forEach(card=>{
  card.addEventListener('click',()=>{
    const which=card.dataset.layer; if(!which||which===activeLayer) return;
    map.removeLayer(getLayer(activeLayer));
    document.querySelector('.lcard.on')?.classList.remove('on');
    card.classList.add('on');
    getLayer(which).addTo(map); activeLayer=which;
  });
});

// ── TABS ──────────────────────────────────────────────────────
function syncTab(tab){
  // Reset filter to "all" on every tab switch to avoid confusion
  if(FILTER!=='all'){
    FILTER='all';
    document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('on'));
    document.querySelector('.fbtn[data-filter="all"]')?.classList.add('on');
    invalidateLayerCache();
  }
  map.removeLayer(getLayer(activeLayer));
  if(TAB_DEFAULT_LAYER[tab]){
    const def=TAB_DEFAULT_LAYER[tab];
    document.querySelectorAll('.lcard').forEach(c=>c.classList.remove('on'));
    document.querySelector(`.lcard[data-layer="${def}"]`)?.classList.add('on');
    getLayer(def).addTo(map); activeLayer=def;
  }
  if(tab==='poly'){if(polyLayerOnMap&&!map.hasLayer(polyLayerOnMap)) polyLayerOnMap.addTo(map);}
  else{if(polyLayerOnMap&&map.hasLayer(polyLayerOnMap)) map.removeLayer(polyLayerOnMap);}
  if(tab==='odd'){if(oddLayerOnMap&&!map.hasLayer(oddLayerOnMap)) oddLayerOnMap.addTo(map);}
  else{if(oddLayerOnMap&&map.hasLayer(oddLayerOnMap)) map.removeLayer(oddLayerOnMap);}
  if(tab==='saints'){Object.values(sacredState).forEach(st=>{if(st.on&&!map.hasLayer(st.layer)) st.layer.addTo(map);});}
  else{Object.values(sacredState).forEach(st=>{if(st.on&&map.hasLayer(st.layer)) map.removeLayer(st.layer);});}
}
document.querySelectorAll('.tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.remove('on'));
    document.querySelectorAll('.pane').forEach(x=>x.classList.remove('on'));
    tab.classList.add('on');
    document.getElementById('pane-'+tab.dataset.tab).classList.add('on');
    syncTab(tab.dataset.tab);
  });
});
