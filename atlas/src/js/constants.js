// ── constants.js ─────────────────────────────────────────────
// Pure data: D destructure, colour palettes, lookup tables.
// No functions, no DOM, no side-effects.

// Destructure loaded JSON data into module-scope variables
const {ENT, SEM, PREFIX, ETYM, HAGIO, POLY, PROFILES, CHARTS, ODD} = D;

// Semantic category colours — Aegean Academic, meaning-matched
const SEM_COLORS={religious:'#1e3a5f',anthroponym:'#b34a2c',geomorphic:'#7a6548',flora:'#6b8e4e',
  fauna:'#c9963c',hydro:'#4a7c8a',colour:'#c49090',ethnic:'#7a3a4a',occupation:'#8a7224',
  descriptive_other:'#8a8a94',built:'#b09478',transport:'#6b5b73',opaque:'#e8e2d4'};
const SEM_LABELS={religious:'Religious',anthroponym:'Place/People',geomorphic:'Landforms',flora:'Flora',
  fauna:'Fauna',hydro:'Water',colour:'Colours',ethnic:'Ethnic',occupation:'Occupations',
  descriptive_other:'Descriptive',built:'Built',transport:'Transport',opaque:'Opaque'};
const SEM_LABELS_GR={religious:'Θρησκευτικά',anthroponym:'Τόποι/Πρόσωπα',geomorphic:'Γεωμορφικά',flora:'Χλωρίδα',
  fauna:'Πανίδα',hydro:'Υδατικά',colour:'Χρώματα',ethnic:'Εθνωνύμια',occupation:'Επαγγέλματα',
  descriptive_other:'Περιγραφικά',built:'Κτίσματα',transport:'Μεταφορές',opaque:'Αδιαφανή'};

// Feature type colours (used by poly, sacred, oddities layers) — Aegean palette, grouped to minimise confusion
const TYPE_COLORS={
  'Chapel':'#c17a3c','Church':'#c17a3c','Monastery':'#c17a3c','Iconostasis':'#c17a3c',
  'Toponym':'#b34a2c','Other Built Up Places':'#b34a2c','Municipality':'#b34a2c','Administrative Capital':'#b34a2c',
  'Peak':'#7a6548','Ridge':'#7a6548','Mountain':'#7a6548','Hill':'#7a6548','Buttress':'#7a6548',
  'Stream':'#4a7c8a','Fountain':'#4a7c8a','Spring':'#4a7c8a','River':'#4a7c8a',
  'Bay':'#1e3a5f','Cove':'#1e3a5f','Point':'#1e3a5f',
  'Rocky Islet':'#9a958a','Rock':'#9a958a','Islet':'#9a958a'};
const TYPE_LEGEND={'#b34a2c':'Settlement','#c17a3c':'Religious','#7a6548':'Mountain','#4a7c8a':'Water','#1e3a5f':'Coastal','#9a958a':'Rocky','#6b5b73':'Other'};

// Feature type labels (Greek) — used by tType() and tLegType() in i18n.js
const TYPE_COLORS_GR={
  'Chapel':'Παρεκκλήσιο','Church':'Εκκλησία','Monastery':'Μοναστήρι','Iconostasis':'Εικονοστάσι',
  'Toponym':'Τοπωνύμιο','Other Built Up Places':'Οικισμός','Municipality':'Δήμος',
  'Administrative Capital':'Πρωτεύουσα','Area':'Περιοχή',
  'Peak':'Κορυφή','Ridge':'Ράχη','Mountain':'Βουνό','Hill':'Λόφος','Buttress':'Πλευρά','Hillside':'Πλαγιά',
  'Stream':'Ρέμα','Fountain':'Βρύση','Spring':'Πηγή','River':'Ποταμός','Lake':'Λίμνη',
  'Bay':'Κόλπος','Cove':'Όρμος','Point':'Ακρωτήριο','Coast':'Ακτή','Anchorage':'Αγκυροβόλιο',
  'Port':'Λιμάνι','Pier':'Προβλήτα','Breakwater':'Μώλος',
  'Rocky Islet':'Βραχονησίδα','Rock':'Βράχος','Islet':'Νησίδα','Islets':'Νησίδες',
  'Reef':'Ύφαλος','Reefs':'Ύφαλοι','Undersea Mound':'Υποθαλάσσιο Ύψωμα',
  'Fish farm':'Ιχθυοτροφείο','Bridge':'Γέφυρα','Cemetary':'Νεκροταφείο'
};
const TYPE_LEGEND_GR={'#b34a2c':'Οικισμός','#c17a3c':'Θρησκευτικό','#7a6548':'Βουνό','#4a7c8a':'Νερό','#1e3a5f':'Παραλία','#9a958a':'Βράχος','#6b5b73':'Άλλο'};

// Etymology reverse lookup (data key → display name)
const ETYM_REV={gk:'Greek',tk:'Turkish/Ottoman',sl:'Slavic',mx:'Mixed/Compound',vn:'Venetian/Italian',al:'Albanian',un:'Unknown'};

// Etymology display colours — single source of truth
const ETYM_COLORS={Greek:'#1e3a5f','Turkish/Ottoman':'#b34a2c',Slavic:'#6b8e4e','Mixed/Compound':'#6b5b73',
  'Venetian/Italian':'#c17a3c',Albanian:'#4a7c8a',Unknown:'#9a958a'};
// Etymology display key → data key mapping
const ETYM_KEY_MAP={Greek:'gk','Turkish/Ottoman':'tk',Slavic:'sl','Mixed/Compound':'mx',
  'Venetian/Italian':'vn',Albanian:'al',Unknown:'un'};

// ── SHARED MUTABLE STATE ─────────────────────────────────────
// Declared here so every concatenated module shares the same binding.
//
//  Variable      Type      Written by            Read by
//  ─────────     ────      ──────────            ───────
//  lang          string    main.js (lang toggle) t(), semLabel(), all i18n helpers
//  FILTER        string    main.js (filter btns) layer builders, sacred, poly, oddities
//  map           L.Map     main.js (init)        layers, charts, sacred
//  activeLayer   string    main.js (tab/card)    main.js, charts
//  sacredState   object    sacred.js (init)      sacred.js, main.js
//  polySelect    Element   poly.js (init)        poly.js
//  polyDetail    Element   poly.js (init)        poly.js
//
// Data aliases (written once from D, read everywhere):
//  ENT, SEM, PREFIX, ETYM, HAGIO, POLY, PROFILES, CHARTS, ODD
let lang='en';
let FILTER='all';

// Classify place name → semantic category (regex heuristic, client-side)
function classifyName(n){
  if(/^(Άγι|Αγί|Παναγ|Προφήτ|Ανάληψ|Μεταμόρφωσ|Τίμιος|Χριστ|Σταυρ|Ανάστασ|Εισόδια|Εισοδίων|Τριάδ|Κοίμησ|Γενέθλιο|Εικονοστ|Μονή|Μοναστ|Ναός|Εκκλησ|Εξωκκλ|Παρεκκλ|Θεοτόκ)/.test(n))return'religious';
  if(/^(Βρύσ|Πηγ|Ποταμ|Ρέμ|Ρέμα|Λίμν|Λάκκ|Γκιόλ)/.test(n))return'hydro';
  if(/^(Κορυφ|Ράχ|Βουν|Λόφ|Πλαγ|Πλευρ|Κάμπ|Πεδιάδ|Κοιλάδ|Φαράγγ|Βάλτ|Πετρ|Βράχ|Γκρεμ|Σπηλ)/.test(n))return'geomorphic';
  if(/^(Ελι|Ελαι|Πλάταν|Δέντρ|Καρυ|Πεύκ|Ροδ|Δάσ|Άλσ|Λειβάδ|Λιβάδ|Λόγγ)/.test(n))return'flora';
  return null;
}
