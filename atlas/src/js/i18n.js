// ── i18n.js ───────────────────────────────────────────────────
// Translation system: I18N table, lang/FILTER state, all t*() helpers.

const I18N = {
  en: {
    title:'Greek Toponymic Atlas', sub:'National Gazetteer',
    tab_maps:'Naming', tab_modif:'Modifiers', tab_saints:'Sacred Names', tab_poly:'Polymorphism', tab_etym:'Origins', tab_odd:'Oddities',
    odd_note:'Curated collection of Greece\'s most colourful place names. Toggle categories to explore.',
    odd_vulgar:'Vulgar', odd_dark:'Dark & Eerie', odd_rogue:'Rogues', odd_animal:'Animals', odd_household:'Household', odd_stinky:'Stinky',
    l_ent:'Toponymic Diversity', d_ent:'How many distinct place names per area?',
    l_sem:'What Place Names Refer To', d_sem:'Dominant naming theme per area',
    l_sem_ent:'Thematic Diversity', d_sem_ent:'How evenly spread are naming themes across categories?',
    mono:'Mono-thematic', multi:'Multi-thematic',
    rep:'Repetitive', div:'Diverse', vdiv:'Very diverse',
    l_pall:'All Modifiers', d_pall:'% of names with any modifier',
    l_neo:'Νέο — "New"', d_neo:'Resettlement, refugee villages (post-1922)',
    l_pal:'Παλαιό — "Old"', d_pal:'Abandoned or renamed settlements',
    l_ano:'Άνω — "Upper"', d_ano:'Upper part of a settlement pair',
    l_kat:'Κάτω — "Lower"', d_kat:'Lower part of a settlement pair',
    l_meg:'Μεγάλο — "Big"', d_meg:'The larger of two same-named settlements',
    l_mik:'Μικρό — "Small"', d_mik:'The smaller of two same-named settlements',
    saints_note:'Toggle sacred names to map their geographic spread across Greece.',
    cat_saints:'Saints', cat_theotokos:'Virgin Mary', cat_prophets:'Prophets',
    cat_archangels:'Archangels', cat_feasts:'Feasts & Cross', cat_structures:'Church Structures', cat_other_religious:'Other Sacred',
    poly_note:'Names appearing as many different feature types — ranked by how evenly spread, not just frequency.',
    poly_ph:'— Select a name —',
    l_ediv:'Linguistic Origin', d_ediv:'How many distinct linguistic roots are present?',
    onlygk:'Only Greek', highdiv:'More diverse',
    enote_t:'Note:', enote_b:'This map shows the diversity of place names by most probable linguistic origin. It is not an indication of the ethnic, linguistic, or religious composition of present-day populations. Hexagons are a spatial analysis unit and do not indicate or imply territorial claims. See Info for more.',
    ct_sem:'Thematic Categories', ct_top:'Most Common Place Names', ct_mods:'Modifier Counts', ct_etym:'Etymology',
    p_div_h:'Toponymic diversity', p_unique:'distinct place names out of', p_features:'features',
    p_unique_pct:'place names unique to this area',
    p_mainly:'Mainly', p_names:'', p_themes:'Top themes',
    p_unclear:'with unclear meaning', p_ftotal:'features total',
    p_mod_pct:'of names carry a modifier',
    p_mod_names:'names with modifiers',
    p_neo_sig:'Marks resettled or newly founded villages',
    p_pal_sig:'Marks abandoned sites or renamed villages',
    p_ano_sig:'Upper part of a settlement pair',
    p_kat_sig:'Lower part of a settlement pair',
    p_meg_sig:'The larger of two same-named settlements',
    p_mik_sig:'The smaller of two same-named settlements',
    p_ldiv_score:'Linguistic diversity score',
    p_norigins:'linguistic origins',
    p_common:'most common',
    hp_title:'Hex Profile', hp_names:'Top Names', hp_sem:'Thematic Breakdown',
    f_all:'All', f_urb:'Urban', f_rur:'Rural',
    conf_title:'Classification confidence', conf_high:'High', conf_med:'Medium', conf_low:'Low',
    langbtn:'Ελληνικά',
  },
  gr: {
    title:'Ελληνικός Τοπωνυμικός Άτλας', sub:'Εθνικό Μητρώο Γεωγραφικών Ονομάτων',
    tab_maps:'Ονόματα', tab_modif:'Προσδιορ.', tab_saints:'Ιερωνύμια', tab_poly:'Πολυμορφία', tab_etym:'Προέλευση', tab_odd:'Περίεργα',
    odd_note:'Επιλεγμένη συλλογή με τα πιο χρωματιστά τοπωνύμια της Ελλάδας. Ενεργοποιήστε κατηγορίες για εξερεύνηση.',
    odd_vulgar:'Χυδαία', odd_dark:'Σκοτεινά', odd_rogue:'Κατεργάρηδες', odd_animal:'Ζώα', odd_household:'Οικιακά', odd_stinky:'Βρωμιάρηδες',
    l_ent:'Τοπωνυμική Ποικιλότητα', d_ent:'Πόσα διαφορετικά τοπωνύμια υπάρχουν ανά περιοχή;',
    l_sem:'Τι Περιγράφουν τα Τοπωνύμια', d_sem:'Κυρίαρχη θεματική κατηγορία ανά περιοχή',
    l_sem_ent:'Θεματική Ποικιλότητα', d_sem_ent:'Πόσο ισόρροπα κατανέμονται οι θεματικές κατηγορίες;',
    mono:'Μονοθεματικό', multi:'Πολυθεματικό',
    rep:'Επαναληπτικό', div:'Ποικίλο', vdiv:'Πολύ ποικίλο',
    l_pall:'Όλοι οι Προσδιορισμοί', d_pall:'% ονομάτων με προσδιορισμό',
    l_neo:'Νέο', d_neo:'Επανεγκατάσταση, προσφυγικοί οικισμοί (μετά το 1922)',
    l_pal:'Παλαιό', d_pal:'Εγκαταλελειμμένοι ή μετονομασμένοι οικισμοί',
    l_ano:'Άνω', d_ano:'Άνω τμήμα ζεύγους οικισμών',
    l_kat:'Κάτω', d_kat:'Κάτω τμήμα ζεύγους οικισμών',
    l_meg:'Μεγάλο', d_meg:'Ο μεγαλύτερος από δύο ομώνυμους οικισμούς',
    l_mik:'Μικρό', d_mik:'Ο μικρότερος από δύο ομώνυμους οικισμούς',
    saints_note:'Εναλλαγή ιερωνυμίων για χαρτογράφηση της γεωγραφικής τους εξάπλωσης.',
    cat_saints:'Άγιοι', cat_theotokos:'Θεοτόκος', cat_prophets:'Προφήτες',
    cat_archangels:'Αρχάγγελοι', cat_feasts:'Εορτές & Σταυρός', cat_structures:'Εκκλ. Κτίσματα', cat_other_religious:'Λοιπά Ιερά',
    poly_note:'Τοπωνύμια που αντιστοιχούν σε πολλούς τύπους χαρακτηριστικών — κατανεμημένα ισόρροπα.',
    poly_ph:'— Επιλέξτε όνομα —',
    l_ediv:'Γλωσσική προέλευση', d_ediv:'Πόσες διαφορετικές γλωσσικές ρίζες υπάρχουν;',
    onlygk:'Μόνο ελληνικά', highdiv:'Μεγαλύτερη ποικιλότητα',
    enote_t:'Σημείωση:', enote_b:'O χάρτης καταγράφει την ποικιλία των τοπωνυμίων με βάση την πιθανότερη γλωσσική προέλευση. Δεν αποτελεί ένδειξη εθνοτικής, γλωσσικής ή θρησκευτικής σύνθεσης σημερινών πληθυσμών. Τα εξάγωνα αποτελούν μονάδα χωρικής ανάλυσης και δεν υποδηλώνουν εδαφικές διεκδικήσεις. Δείτε περισσότερα στις πληροφορίες.',
    ct_sem:'Θεματικές Κατηγορίες', ct_top:'Συχνότερα Τοπωνύμια', ct_mods:'Πλήθος Προσδιορισμών', ct_etym:'Ετυμολογία',
    p_div_h:'Τοπωνυμική ποικιλότητα', p_unique:'μοναδικά τοπωνύμια σε', p_features:'χαρακτηριστικά',
    p_unique_pct:'από τα τοπωνύμια μοναδικά εδώ',
    p_mainly:'Κυρίως', p_names:'', p_themes:'Θεματικές',
    p_unclear:'με ασαφή ονομασία', p_ftotal:'τοπωνύμια',
    p_mod_pct:'ονομάτων με προσδιορισμό',
    p_mod_names:'τοπωνύμια με προσδιορισμό',
    p_neo_sig:'Νεοϊδρυθέντες ή μετεγκατεστημένοι οικισμοί',
    p_pal_sig:'Εγκαταλελειμμένα ή μετονομασμένα',
    p_ano_sig:'Άνω τμήμα ζεύγους οικισμών',
    p_kat_sig:'Κάτω τμήμα ζεύγους οικισμών',
    p_meg_sig:'Ο μεγαλύτερος από δύο ομώνυμους οικισμούς', p_mik_sig:'Ο μικρότερος από δύο ομώνυμους οικισμούς',
    p_ldiv_score:'Γλωσσική ποικιλότητα',
    p_norigins:'γλωσσικές ρίζες',
    p_common:'συχνότερο',
    hp_title:'Προφίλ Περιοχής', hp_names:'Κυριότερα Ονόματα', hp_sem:'Θεματική Κατανομή',
    f_all:'Όλα', f_urb:'Αστικά', f_rur:'Αγροτικά',
    conf_title:'Βεβαιότητα ταξινόμησης', conf_high:'Υψηλή', conf_med:'Μέτρια', conf_low:'Χαμηλή',
    langbtn:'English',
  }
};
// lang and FILTER declared in constants.js (shared mutable state)
function t(k){ const v=I18N[lang][k]; return v!==undefined?v:k; }

const LBL_EN={
  'too few names to assess':'too few names to assess',
  'low diversity — some repetition':'low diversity — some repetition',
  'low diversity — moderate repetition':'low diversity — moderate repetition',
  'moderate diversity':'moderate diversity',
  'high diversity':'high diversity',
  'very high diversity':'very high diversity'
};
const LBL_GR={
  'too few names to assess':'πολύ λίγα δεδομένα',
  'low diversity — some repetition':'χαμηλή τοπωνυμική ποικιλότητα',
  'low diversity — moderate repetition':'χαμηλή τοπωνυμική ποικιλότητα — επανάληψη',
  'moderate diversity':'μέτρια τοπωνυμική ποικιλότητα',
  'high diversity':'υψηλή τοπωνυμική ποικιλότητα',
  'very high diversity':'πολύ υψηλή τοπωνυμική ποικιλότητα'
};
function translateLabel(s){ return lang==='gr'?(LBL_GR[s]||s):(s); }

const INTERP_GR={
  'Settlements and landscape named with similar diversity':'Οικισμοί και τοπίο με παρόμοια ποικιλότητα',
  'Landscape features have more varied naming here':'Το τοπίο έχει μεγαλύτερη τοπωνυμική ποικιλότητα',
  'Settlements have more varied naming here':'Οι οικισμοί έχουν μεγαλύτερη τοπωνυμική ποικιλότητα'
};
function tInterp(s){ return lang==='gr'?(INTERP_GR[s]||s):(s); }

// Semantic label translation (uses SEM_LABELS/SEM_LABELS_GR from constants.js)
function semLabel(k){return lang==='gr'?(SEM_LABELS_GR[k]||k):(SEM_LABELS[k]||k);}

// Feature type and etymology translations (use TYPE_COLORS_GR/TYPE_LEGEND_GR/TYPE_LEGEND/ETYM_REV from constants.js)
function tType(s){ return lang==='gr'?(TYPE_COLORS_GR[s]||s):(s); }
function tLegType(c){ return lang==='gr'?(TYPE_LEGEND_GR[c]||TYPE_LEGEND[c]||c):(TYPE_LEGEND[c]||c); }
const ETYM_GR={
  'Greek':'Ελληνική','Turkish/Ottoman':'Τουρκο-οθωμανική','Slavic':'Σλαβική',
  'Mixed':'Μικτή','Mixed/Compound':'Μικτή','Venetian':'Βενετσιάνικη',
  'Venetian/Italian':'Βενετσιάνικη','Albanian':'Αλβανική','Unknown':'Άγνωστη'
};
function tEtym(s){ return lang==='gr'?(ETYM_GR[s]||s):(s); }
const CONF_EN  = {h:'high', m:'med', l:'low'};
const CONF_GR  = {h:'υψηλή', m:'μέτρια', l:'χαμηλή'};
const CONF_COL = {h:'#22c55e', m:'#eab308', l:'#ef4444'};

function confLbl(c) {
  const txt = lang === 'gr' ? CONF_GR[c] : CONF_EN[c];
  if (!txt) return '';
  return `<span class="conf-lbl" style="color:${CONF_COL[c]}">${txt}</span>`;
}
function formatNonGreek(ngl){if(!ngl||!ngl.length) return '';
  const confDot=c=>{const col={h:'#22c55e',m:'#eab308',l:'#ef4444'};return col[c]?`<span class="etym-dot" style="background:${col[c]}"></span>`:''};
  return '<br>'+ngl.map(r=>`${esc(r[0])}: ${esc(tEtym(ETYM_REV[r[1]]||r[1]))}${confDot(r[2])}`).join('<br>');}

function applyLang(){
  document.documentElement.lang=lang==='gr'?'el':'en';
  document.querySelectorAll('[data-i]').forEach(el=>{
    const k=el.dataset.i;
    if(I18N[lang][k]) el.textContent=I18N[lang][k];
  });
  document.getElementById('lang-btn').textContent=t('langbtn');
  updateSemLeg();
  buildCharts();
  renderOddList();
  // rebuild poly select options with translated type counts
  const pSel2=document.getElementById('poly-sel');
  const curVal=pSel2.value;
  Array.from(pSel2.options).forEach(opt=>{
    if(opt.value&&POLY[opt.value]){
      const info=POLY[opt.value];
      opt.textContent=`${opt.value} (${info.n_types} ${lang==='gr'?'τύποι':'types'} · ${Math.round(info.norm_entropy*100)}%)`;
    }
  });
  pSel2.value=curVal;
  if(curVal) pSel2.dispatchEvent(new Event('change'));
  // refresh info modal if open
  if(document.getElementById('info-overlay').classList.contains('open'))
    document.getElementById('info-body').innerHTML=buildInfoContent();
}
document.getElementById('lang-btn').addEventListener('click',()=>{
  lang=lang==='en'?'gr':'en'; applyLang();
});

// ── INFO PANEL CONTENT ────────────────────────────────────────
function buildInfoContent(){
  const en=lang==='en';
  return (en?`
<h2>Greek Toponymic Atlas</h2>
<div class="info-version">Version 1.0 &middot; 2026</div>
<div class="info-author">Aris Vartholomaios &middot; University of Thessaly</div>
<div class="info-license">Code: MIT &middot; Content &amp; data: CC BY-NC-ND 4.0 &middot; <a href="https://github.com/avarth/toponymic_atlas_of_Greece" target="_blank" rel="noopener">Source code</a></div>
<div class="info-license">Cite: Vartholomaios, A. (2026). <i>Greek Toponymic Atlas</i> (v1.0). Zenodo. <a href="https://doi.org/10.5281/zenodo.19443730" target="_blank" rel="noopener">doi:10.5281/zenodo.19443730</a></div>

<h3>Abstract</h3>
<p>Interactive spatial analysis of 41,932 unique place names (90,592 geocoded features) from the National Gazetteer of Geographical Names of Greece. Each toponym is classified by etymological origin (Greek, Turkish/Ottoman, Slavic, Albanian, Venetian/Italian, Mixed, Unknown) and semantic category (religious, geomorphic, flora, fauna, anthroponym, etc.). Results are visualised on an H3 hexagonal grid across six thematic layers.</p>

<h3>Methodology</h3>
<p>Etymological origin is assigned through a three-stage hybrid pipeline:</p>
<ul>
<li><b>Stage 1 — Morphological rules:</b> Each name is matched against a combined Greek lexicon (84,619 lemmas from Wiktionary via Kaikki.org + 1,047,153 word forms from the EELLAK spell dictionary) and curated pattern inventories for non-Greek morphemes (Slavic, Turkish/Ottoman, Venetian, Albanian). The core rule is: etymology follows the root's living language. Classification refers to the linguistic origin of the name's root, following standard etymological practice — it does not reflect the language historically or currently spoken at a location, nor the identity of its inhabitants. This stage resolves approximately 78% of names.</li>
<li><b>Stage 2 — LLM disambiguation:</b> Unresolved names are processed through a large language model (Claude Sonnet 4.6, Anthropic) with the full classification ruleset embedded. The model returns an etymology, semantic category, and reasoning chain, adjudicated against Stage 1 via confidence-weighted merge.</li>
<li><b>Stage 3 — Manual validation:</b> A stratified sample of 200 names is manually reviewed by the author against published etymological references; all 2,468 non-Greek classifications are individually verified through LLM-drafted corrections reviewed and adjudicated by the author against the same sources.</li>
</ul>
<p>Semantic categories are assigned primarily by the LLM, which analyses name morphology, root meaning, and feature-type context. The gazetteer's 104 feature types provide a coarse signal (e.g., Chapel &rarr; religious), but most names require deeper analysis. Approximately 65% of names are classified as semantically opaque — an accurate reflection of lexical erosion in Greek toponymy.</p>

<h3>Data Sources</h3>
<ul>
<li><b>National Gazetteer of Geographical Names of Greece</b> — 90,592 named, typed, geocoded features. Hellenic Military Geographical Service (HMGS) &amp; Hellenic Navy Hydrographic Service (HNHS). <a href="https://www.gys.gr/index.html" target="_blank" rel="noopener">gys.gr</a></li>
<li><b>GHSL Built-Up Surface</b> (GHS-BUILT-S R2023A) — urban/rural classification. European Commission JRC. CC BY 4.0.</li>
<li><b>Greek Census Settlements</b> (2011) — secondary urban classification. ELSTAT.</li>
<li><b>Kaikki.org Greek Dictionary</b> — 84,619 lemmas from Wiktionary. <a href="https://kaikki.org/dictionary/Greek/" target="_blank" rel="noopener">kaikki.org</a></li>
<li><b>EELLAK Spell Dictionary</b> — 1,047,153 Greek word forms. <a href="https://ellak.gr/" target="_blank" rel="noopener">ellak.gr</a></li>
</ul>
<p>Basemap tiles by <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>. Map data &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors. Built with <a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>.</p>

<h3>Oversights &amp; Errata</h3>
<p>Every care has been taken to ensure accuracy. Etymological origin and semantic classification were produced through a combination of automated methods and manual review against published sources; however, the process was validated on a stratified sample rather than exhaustively for all 41,932 names. Errors in individual classifications are possible, particularly for rare or locally specific toponyms.</p>
<p>If you notice an error or have a correction to suggest, please <a href="https://github.com/avarth/toponymic_atlas_of_Greece/issues" target="_blank" rel="noopener">open an issue</a> including the toponym, the proposed correction, and a published source supporting it.</p>

<h3>AI Disclosure</h3>
<p>This tool was developed with AI assistance (Anthropic Claude Opus 4.6 / Sonnet 4.6). The author designed the architecture and planned all features; AI tools were used to draft code diffs, code cleanup and implementation. All AI-generated code was reviewed by the author before inclusion. The author takes full responsibility for the correctness, design, and scientific validity of the code.</p>

<div class="info-warn"><b>Note:</b> This atlas maps the diversity of place names by most probable linguistic origin of the name's root, following standard etymological practice. It is not an indication of the language historically or currently spoken at any location, nor of the ethnic, linguistic, or religious composition of present-day populations. Hexagons are a spatial analysis unit and do not indicate or imply territorial claims.</div>
`:`
<h2>Ελληνικός Τοπωνυμικός Άτλας</h2>
<div class="info-version">Έκδοση 1.0 &middot; 2026</div>
<div class="info-author">Άρης Βαρθολομαίος &middot; Πανεπιστήμιο Θεσσαλίας</div>
<div class="info-license">Κώδικας: MIT &middot; Περιεχόμενο &amp; δεδομένα: CC BY-NC-ND 4.0 &middot; <a href="https://github.com/avarth/toponymic_atlas_of_Greece" target="_blank" rel="noopener">Πηγαίος κώδικας</a></div>
<div class="info-license">Αναφορά: Vartholomaios, A. (2026). <i>Greek Toponymic Atlas</i> (v1.0). Zenodo. <a href="https://doi.org/10.5281/zenodo.19443730" target="_blank" rel="noopener">doi:10.5281/zenodo.19443730</a></div>

<h3>Περίληψη</h3>
<p>Διαδραστική χωρική ανάλυση 41.932 μοναδικών τοπωνυμίων (90.592 γεωκωδικοποιημένα χαρακτηριστικά) από το Εθνικό Μητρώο Γεωγραφικών Ονομάτων της Ελλάδας. Κάθε τοπωνύμιο ταξινομείται κατά ετυμολογική προέλευση (ελληνική, τουρκο-οθωμανική, σλαβική, αλβανική, βενετσιάνικη, μικτή, άγνωστη) και σημασιολογική κατηγορία (θρησκευτικό, γεωμορφολογικό, χλωρίδα, πανίδα, ανθρωπωνύμιο κ.ά.). Τα αποτελέσματα απεικονίζονται σε εξαγωνικό πλέγμα H3 μέσω έξι θεματικών επιπέδων.</p>

<h3>Μεθοδολογία</h3>
<p>Η ετυμολογική προέλευση αποδίδεται μέσω υβριδικής μεθοδολογίας τριών σταδίων:</p>
<ul>
<li><b>Στάδιο 1 — Μορφολογικοί κανόνες:</b> Κάθε όνομα αντιπαραβάλλεται με συνδυασμένο ελληνικό λεξικό (84.619 λήμματα από Wiktionary μέσω Kaikki.org + 1.047.153 τύποι λέξεων από το ορθογραφικό λεξικό ΕΕΛΛΑΚ) και επιμελημένα ευρετήρια μη ελληνικών μορφημάτων. Βασικός κανόνας: η ετυμολογία ακολουθεί τη ζωντανή γλώσσα της ρίζας. Η ταξινόμηση αφορά τη γλωσσική προέλευση της ρίζας του ονόματος, κατά την καθιερωμένη ετυμολογική πρακτική — δεν αντανακλά τη γλώσσα που μιλιόταν ή μιλιέται σε μια περιοχή, ούτε την ταυτότητα των κατοίκων της. Το στάδιο αυτό επιλύει περίπου το 78% των ονομάτων.</li>
<li><b>Στάδιο 2 — Αποσαφήνιση μέσω LLM:</b> Τα ανεπίλυτα ονόματα επεξεργάζονται από γλωσσικό μοντέλο (Claude Sonnet 4.6, Anthropic) με ενσωματωμένο το πλήρες σύνολο κανόνων. Το μοντέλο επιστρέφει ετυμολογία, σημασιολογική κατηγορία και αλυσίδα αιτιολόγησης.</li>
<li><b>Στάδιο 3 — Χειροκίνητη επικύρωση:</b> Στρωματοποιημένο δείγμα 200 ονομάτων ελέγχεται χειροκίνητα από τον δημιουργό με αντιπαραβολή σε δημοσιευμένες ετυμολογικές πηγές· όλες οι 2.468 μη ελληνικές ταξινομήσεις επαληθεύονται μεμονωμένα μέσω προτάσεων LLM που εξετάζονται και κρίνονται από τον δημιουργό βάσει των ίδιων πηγών.</li>
</ul>
<p>Οι σημασιολογικές κατηγορίες αποδίδονται κυρίως από το γλωσσικό μοντέλο, που αναλύει τη μορφολογία, τη σημασία της ρίζας και τον τύπο χαρακτηριστικού. Οι 104 τύποι του μητρώου παρέχουν ένα αδρό σήμα (π.χ. Εκκλησάκι &rarr; θρησκευτικό), αλλά τα περισσότερα ονόματα απαιτούν βαθύτερη ανάλυση. Περίπου 65% ταξινομούνται ως σημασιολογικά αδιαφανή — αντικατοπτρίζοντας τη λεξιλογική φθορά στην ελληνική τοπωνυμία.</p>

<h3>Πηγές δεδομένων</h3>
<ul>
<li><b>Εθνικό Μητρώο Γεωγραφικών Ονομάτων Ελλάδας</b> — 90.592 χαρακτηριστικά. Γεωγραφική Υπηρεσία Στρατού (ΓΥΣ) &amp; Υδρογραφική Υπηρεσία Πολεμικού Ναυτικού (ΥΠΠΝ). <a href="https://www.gys.gr/index.html" target="_blank" rel="noopener">gys.gr</a></li>
<li><b>GHSL Built-Up Surface</b> (GHS-BUILT-S R2023A) — αστική/αγροτική ταξινόμηση. Ευρωπαϊκή Επιτροπή JRC. CC BY 4.0.</li>
<li><b>Απογραφή οικισμών</b> (2011) — δευτερεύουσα αστική ταξινόμηση. ΕΛΣΤΑΤ.</li>
<li><b>Kaikki.org Ελληνικό Λεξικό</b> — 84.619 λήμματα από Wiktionary. <a href="https://kaikki.org/dictionary/Greek/" target="_blank" rel="noopener">kaikki.org</a></li>
<li><b>Ορθογραφικό Λεξικό ΕΕΛΛΑΚ</b> — 1.047.153 τύποι ελληνικών λέξεων. <a href="https://ellak.gr/" target="_blank" rel="noopener">ellak.gr</a></li>
</ul>
<p>Υπόβαθρο χάρτη: <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>. Δεδομένα χάρτη &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>. Κατασκευή με <a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>.</p>

<h3>Παραλείψεις &amp; Διορθώσεις</h3>
<p>Καταβλήθηκε κάθε δυνατή προσπάθεια για την ακρίβεια των δεδομένων. Η ετυμολογική και σημασιολογική ταξινόμηση πραγματοποιήθηκε μέσω συνδυασμού αυτοματοποιημένων μεθόδων και χειροκίνητου ελέγχου με αντιπαραβολή σε δημοσιευμένες πηγές· ωστόσο, η επικύρωση βασίστηκε σε στρωματοποιημένο δείγμα και όχι εξαντλητικά για το σύνολο των 41.932 ονομάτων. Σφάλματα σε μεμονωμένες ταξινομήσεις είναι πιθανά, ιδίως σε σπάνια ή τοπικά τοπωνύμια.</p>
<p>Αν εντοπίσετε κάποιο σφάλμα ή επιθυμείτε να προτείνετε διόρθωση, <a href="https://github.com/avarth/toponymic_atlas_of_Greece/issues" target="_blank" rel="noopener">ανοίξτε ένα issue</a> αναφέροντας το τοπωνύμιο, την προτεινόμενη διόρθωση και δημοσιευμένη πηγή που την τεκμηριώνει.</p>

<h3>Δήλωση χρήσης AI</h3>
<p>Το εργαλείο αναπτύχθηκε με τη βοήθεια τεχνητής νοημοσύνης (Anthropic Claude Opus 4.6 / Sonnet 4.6). Ο δημιουργός σχεδίασε την αρχιτεκτονική και προγραμμάτισε όλα τα χαρακτηριστικά· τα εργαλεία AI χρησιμοποιήθηκαν για σύνταξη κώδικα, καθαρισμό και υλοποίηση. Όλος ο κώδικας που παρήχθη από AI ελέγχθηκε από τον δημιουργό πριν τη συμπερίληψή του. Ο δημιουργός φέρει πλήρη ευθύνη για την ορθότητα, τον σχεδιασμό και την επιστημονική εγκυρότητα του κώδικα.</p>

<div class="info-warn"><b>Σημείωση:</b> Ο άτλας καταγράφει την ποικιλία των τοπωνυμίων με βάση την πιθανότερη γλωσσική προέλευση της ρίζας του ονόματος, κατά την καθιερωμένη ετυμολογική πρακτική. Δεν αποτελεί ένδειξη της γλώσσας που μιλιόταν ή μιλιέται σε οποιαδήποτε περιοχή, ούτε της εθνοτικής, γλωσσικής ή θρησκευτικής σύνθεσης σημερινών πληθυσμών. Τα εξάγωνα αποτελούν μονάδα χωρικής ανάλυσης και δεν υποδηλώνουν εδαφικές διεκδικήσεις.</div>
`);
}
