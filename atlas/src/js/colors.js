// ── colors.js ─────────────────────────────────────────────────
// Pure colour functions: linear interpolation, Viridis palette, sequential ramp.
// Also: esc() HTML-escape helper for safe innerHTML interpolation.

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function lerp(a,b,t){return a+(b-a)*t;}

function viridis(v){
  v=Math.max(0,Math.min(1,v));
  const s=[[68,1,84],[72,40,120],[62,83,160],[49,122,183],[38,157,199],[53,183,171],[109,204,117],[180,221,66],[253,231,37]];
  const i=(s.length-1)*v,lo=Math.floor(i),hi=Math.min(lo+1,s.length-1),f=i-lo;
  return `rgb(${Math.round(s[lo][0]+(s[hi][0]-s[lo][0])*f)},${Math.round(s[lo][1]+(s[hi][1]-s[lo][1])*f)},${Math.round(s[lo][2]+(s[hi][2]-s[lo][2])*f)})`;
}

// Urban/rural filter guard — shared by sacred, poly, oddities modules
function passesFilter(p){
  if(FILTER==='urb'&&!p.s) return false;
  if(FILTER==='rur'&&p.s) return false;
  return true;
}

function seqColor(v,r1,g1,b1,r2,g2,b2){
  v=Math.max(0,Math.min(1,v));
  return `rgb(${Math.round(lerp(r1,r2,v))},${Math.round(lerp(g1,g2,v))},${Math.round(lerp(b1,b2,v))})`;
}
