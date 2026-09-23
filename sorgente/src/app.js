{{BOOKS}}

// chiave stabile per libro, indipendente dalla posizione nell'array:
// evita che il progresso salvato si "sfasi" se in futuro la lista cambia ordine
function slugify(s){
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}
BOOKS.forEach(b=>{ b.key = slugify(b.t); });

const ICON_CHECK='<svg viewBox="0 0 24 24" fill="none"><path d="M4 12.5 9 17l11-11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const ICON_PLUS='<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const ICON_SEARCH='<svg viewBox="0 0 24 24" fill="none"><circle cx="10.3" cy="10.3" r="6.2" stroke="currentColor" stroke-width="1.6"/><path d="M15.1 15.1 20 20" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
const ICON_RESET='<svg viewBox="0 0 24 24" fill="none"><path d="M4 4v6h6M20 20v-6h-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 15a8 8 0 0 0 13.9 3M18.5 9A8 8 0 0 0 4.6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

// Colore-gemma per ogni mondo: e' il colore dell'astro sulla carta,
// del pallino nel catalogo e della barra di avanzamento.
const WORLD_COLORS = {
  "Sel":"#E8BE5A",               // eliodoro
  "Scadrial":"#C9D4E6",          // diamante
  "Nalthis":"#B48CF2",           // ametista
  "Roshar":"#5B8FF0",            // zaffiro
  "First of the Sun":"#46C98A",  // smeraldo
  "Threnody":"#D65A6E",          // rubino
  "Antologia":"#C9B48A",
  "Taldain":"#E3A052",           // topazio
  "Lumar":"#9ACD5E",             // peridoto
  "Yolen":"#E07AA8",             // granato rosa
  "Mondo sconosciuto":"#9AA0AA", // quarzo fume'
  "Racconti di Hoid":"#B98AD0"
};
const WORLD_DESC = {
  "Sel":"Magia AonDor: simboli tracciati che modellano la realtà.",
  "Scadrial":"Allomanzia: bruciare metalli per ottenere poteri.",
  "Nalthis":"BioCromatica: il Soffio come valuta magica e vitale.",
  "Roshar":"Luce Tempestosa e Cavalieri Radiosi, tra le tempeste.",
  "First of the Sun":"Isole tropicali sospese tra cielo e mare.",
  "Threnody":"Un mondo di orrore gotico ai margini del Cosmere.",
  "Antologia":"Novelle raccolte con note che collegano i mondi.",
  "Taldain":"Maestria della Sabbia su un pianeta che non ruota.",
  "Lumar":"Mari di spore magiche al posto dell'acqua.",
  "Yolen":"Due mondi paralleli, due protagonisti in contatto.",
  "Mondo sconosciuto":"Un pianeta morente, un futuro lontanissimo.",
  "Racconti di Hoid":"Storie standalone narrate dal cantastorie del Cosmere."
};

// ---------------------------------------------------------------
// Carta stellare
// Ogni sistema sta su uno dei tre anelli orbitali (0 = interno),
// a un angolo in gradi (0 = destra, senso orario). "side" e' il lato
// dell'etichetta: mai sopra, perche' sopra l'astro si ferma il viaggiatore.
// Antologia e Racconti di Hoid non sono pianeti: stanno "fuori mappa".
// ---------------------------------------------------------------
const CHART = {W:340, H:236, cx:170, cy:118, rings:[[60,32],[112,62],[160,96]]};
const SYSTEMS = {
  "Sel":               {ring:0, a:200, side:"w"},
  "Scadrial":          {ring:0, a:340, side:"e"},
  "Nalthis":           {ring:0, a:90,  side:"s"},
  "Taldain":           {ring:1, a:255, side:"w"},
  "Threnody":          {ring:1, a:300, side:"e"},
  "Roshar":            {ring:1, a:25,  side:"s"},
  "First of the Sun":  {ring:1, a:150, side:"s"},
  "Lumar":             {ring:2, a:195, side:"e"},
  "Yolen":             {ring:2, a:105, side:"e"},
  "Mondo sconosciuto": {ring:2, a:345, side:"w", label:"Ignoto"}
};
const WIZARD_SRC = "{{WIZARD}}";
const C = {grid:"#1B2538", grid2:"#28354E", light:"#DCE6F2", quiet:"#74829A", faint:"#56627A", inst:"#8FC7CF", void:"#06090F"};

{{BLOG}}

const KEY="cosmere-journey-v1";
let state = {done:[]};
try{ state = JSON.parse(localStorage.getItem(KEY)||'null') || {done:[]}; }catch(_){}
state.done = Array.isArray(state.done) ? state.done : [];

// migrazione: le versioni precedenti salvavano indici numerici.
// li converto nella chiave stabile del libro corrispondente, una tantum.
if(state.done.length && typeof state.done[0] === 'number'){
  state.done = state.done.map(i=>BOOKS[i]?.key).filter(Boolean);
}

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
const pad=n=>String(n).padStart(2,"0");
const worldOf=b=>b.w.split(" · ")[0];
const isDone=b=>state.done.includes(b.key);
const worldLink=w=>"percorso.html#mondo="+encodeURIComponent(w);

// Filtro del percorso: arriva dall'hash (#mondo=Roshar), cosi' carta e
// catalogo delle altre pagine possono aprire il Percorso gia' filtrato.
function readHashFilter(){
  const m = location.hash.match(/^#mondo=(.+)$/);
  if(!m) return null;
  let w = null;
  try{ w = decodeURIComponent(m[1]); }catch(_){ return null; }
  return BOOKS.some(b=>worldOf(b)===w) ? w : null;
}
let worldFilter = readHashFilter();

function save(){ try{ localStorage.setItem(KEY,JSON.stringify(state)); }catch(_){} }
function pct(){return Math.round((state.done.length/BOOKS.length)*100)}
function uniqueWorlds(){return new Set(BOOKS.filter(isDone).map(worldOf)).size}
function amazonUrl(title){return "https://www.amazon.it/s?k="+encodeURIComponent(title.replace(/\(.*?\)/g,'').trim()+" Brandon Sanderson")}
function visibleBooks(){return BOOKS.map((b,i)=>({b,i})).filter(o=>!worldFilter || worldOf(o.b)===worldFilter)}
function nextIndex(){return BOOKS.findIndex(b=>!isDone(b))}
function worldNames(){return [...new Set(BOOKS.map(worldOf))]}
function worldStat(w){
  const list=BOOKS.filter(b=>worldOf(b)===w);
  return {count:list.length, done:list.filter(isDone).length};
}

function systemPos(name){
  const s=SYSTEMS[name], r=CHART.rings[s.ring], t=s.a*Math.PI/180;
  return {x:+(CHART.cx+r[0]*Math.cos(t)).toFixed(1), y:+(CHART.cy+r[1]*Math.sin(t)).toFixed(1)};
}

function renderChart(){
  const host=$("#chartSvg"); if(!host) return;
  const ni=nextIndex();
  const nextWorld = ni<0 ? null : worldOf(BOOKS[ni]);

  // Rotta: i mondi dei libri letti, in ordine di pubblicazione,
  // senza ripetizioni consecutive. Le tratte ripercorse si sommano e brillano di piu'.
  const route=[];
  BOOKS.filter(isDone).map(worldOf).filter(w=>SYSTEMS[w]).forEach(w=>{ if(route[route.length-1]!==w) route.push(w); });
  const here = route.length ? systemPos(route[route.length-1]) : {x:CHART.cx, y:CHART.cy};

  let s='';
  // anelli, assi, tacche
  CHART.rings.forEach(([rx,ry])=>{ s+=`<ellipse cx="${CHART.cx}" cy="${CHART.cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${C.grid}" stroke-width=".8"/>`; });
  s+=`<line x1="${CHART.cx}" y1="14" x2="${CHART.cx}" y2="${CHART.H-14}" stroke="${C.grid}" stroke-width=".7" stroke-dasharray="2 4"/>`;
  s+=`<line x1="4" y1="${CHART.cy}" x2="${CHART.W-4}" y2="${CHART.cy}" stroke="${C.grid}" stroke-width=".7" stroke-dasharray="2 4"/>`;
  const [orx,ory]=CHART.rings[2];
  for(let a=0;a<360;a+=15){
    const t=a*Math.PI/180, len=a%45===0?5:2.5;
    const x1=CHART.cx+orx*Math.cos(t), y1=CHART.cy+ory*Math.sin(t);
    const x2=CHART.cx+(orx+len)*Math.cos(t), y2=CHART.cy+(ory+len*ory/orx)*Math.sin(t);
    s+=`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${C.grid2}" stroke-width=".8"/>`;
  }
  s+=`<path d="M${CHART.cx-3} ${CHART.cy}h6M${CHART.cx} ${CHART.cy-3}v6" stroke="${C.faint}" stroke-width=".8"/>`;

  // rotta percorsa
  for(let i=1;i<route.length;i++){
    const a=systemPos(route[i-1]), b=systemPos(route[i]);
    s+=`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${C.inst}" stroke-width=".9" stroke-opacity=".32" stroke-linecap="round"/>`;
  }
  // tratta verso la prossima osservazione
  if(nextWorld && SYSTEMS[nextWorld] && route[route.length-1]!==nextWorld){
    const b=systemPos(nextWorld);
    s+=`<line x1="${here.x}" y1="${here.y}" x2="${b.x}" y2="${b.y}" stroke="${C.inst}" stroke-width=".9" stroke-dasharray="3 3" stroke-opacity=".85"/>`;
  }

  // sistemi
  let visited=0;
  Object.keys(SYSTEMS).forEach(name=>{
    const p=systemPos(name), st=worldStat(name), g=WORLD_COLORS[name]||C.light;
    const seen=st.done>0, isNext=name===nextWorld;
    if(seen) visited++;
    const label=(SYSTEMS[name].label||name).toUpperCase()+(seen?` ${st.done}/${st.count}`:"");
    const side=SYSTEMS[name].side;
    const lx = side==="e"? p.x+11 : side==="w"? p.x-11 : p.x;
    const ly = side==="s"? p.y+18 : p.y+3;
    const anchor = side==="e"?"start":side==="w"?"end":"middle";
    const col = isNext? C.inst : seen? C.light : C.quiet;
    const r = seen? 2.6+Math.min(st.done,4)*.45 : 2.4;

    s+=`<a href="${worldLink(name)}" aria-label="${esc(name)}: ${st.done} di ${st.count} letti">`;
    s+=`<circle class="hit" cx="${p.x}" cy="${p.y}" r="13" fill="transparent" stroke="none"/>`;
    if(seen) s+=`<circle cx="${p.x}" cy="${p.y}" r="${(r*2.6).toFixed(1)}" fill="${g}" fill-opacity=".14"/>`;
    if(isNext) s+=`<circle class="pulse" cx="${p.x}" cy="${p.y}" r="7.5" fill="none" stroke="${C.inst}" stroke-width=".9"/>`;
    s+= seen
      ? `<circle cx="${p.x}" cy="${p.y}" r="${r.toFixed(1)}" fill="${g}"/>`
      : `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${isNext?C.inst:C.void}" stroke="${isNext?C.inst:C.faint}" stroke-width=".9"/>`;
    s+=`<text class="lbl" x="${lx}" y="${ly}" text-anchor="${anchor}" fill="${col}">${esc(label)}</text>`;
    s+=`</a>`;
  });

  // il viaggiatore: sta sull'ultimo sistema visitato (al centro, prima di partire)
  const sw=15.5, sh=28.5;
  s+=`<image href="${WIZARD_SRC}" x="${(here.x-sw/2).toFixed(1)}" y="${(here.y-sh-5).toFixed(1)}" width="${sw}" height="${sh}" preserveAspectRatio="xMidYMax meet" aria-hidden="true"/>`;

  const total=Object.keys(SYSTEMS).length;
  host.innerHTML=`<svg viewBox="0 0 ${CHART.W} ${CHART.H}" role="group" aria-label="Carta del Cosmere: ${visited} sistemi visitati su ${total}">${s}</svg>`;
  $("#chartCount").innerHTML=`<b>${pad(visited)}</b> / ${pad(total)} sistemi`;

  // fuori mappa
  const off=worldNames().filter(w=>!SYSTEMS[w]);
  const SHORT={"Racconti di Hoid":"Hoid"};
  $("#offmap").innerHTML='<span>Fuori mappa</span>'+off.map(w=>{
    const st=worldStat(w);
    return `<a href="${worldLink(w)}" class="${st.done?'':'todo'} ${w===nextWorld?'is-next':''}" style="--g:${WORLD_COLORS[w]||C.light}"><i></i>${esc(SHORT[w]||w)} ${st.done}/${st.count}</a>`;
  }).join("");
}

function renderNext(){
  const ni=nextIndex(), p=pct(), done=state.done.length;
  if(ni<0){
    $("#status").textContent="Percorso completato";
    $("#nextCard").innerHTML='<span class="kicker">Tutti i sistemi osservati</span><h3>Hai completato il percorso.</h3><p class="next-note">Hai letto tutto quello che è presente nella lista. Ora puoi ricominciare, rileggere un mondo o attendere la prossima uscita.</p><div class="actions"><button class="btn btn-primary" onclick="resetProgress()">'+ICON_RESET+' Ricomincia</button></div>';
    return;
  }
  const b=BOOKS[ni], w=worldOf(b);
  $("#status").textContent=ni===0?"Prima tappa":"Tappa "+(ni+1);
  const ticks=BOOKS.map((x,i)=>'<i class="'+(isDone(x)?'on':(i===ni?'nx':''))+'"></i>').join("");
  $("#nextCard").innerHTML=
    '<span class="kicker">'+(ni===0?"Prima osservazione":"Prossima osservazione")+' · '+pad(ni+1)+'/'+BOOKS.length+'</span>'+
    '<h3>'+esc(b.t)+(b.soon?' <small>annunciata</small>':'')+'</h3>'+
    '<div class="meta"><span class="gem" style="--g:'+(WORLD_COLORS[w]||C.light)+'"></span><span class="mt">'+esc(b.w)+' · '+b.y+'</span></div>'+
    (b.n?'<p class="next-note">'+esc(b.n)+'</p>':'')+
    '<div class="actions"><button class="btn btn-primary" onclick="markDone('+ni+')">'+ICON_CHECK+' Segna come letto</button>'+
    '<a class="btn btn-ghost" href="'+amazonUrl(b.t)+'" target="_blank" rel="noopener noreferrer">'+ICON_SEARCH+' Cerca</a></div>'+
    '<div class="scale" aria-label="'+done+' libri letti su '+BOOKS.length+'"><div class="scale-top"><span>'+pad(done)+' / '+BOOKS.length+'</span><span>'+p+'%</span></div><div class="ticks" aria-hidden="true">'+ticks+'</div></div>';
}

function renderWorlds(){
  $("#worldChips").innerHTML=worldNames().map(w=>{
    const st=worldStat(w), g=WORLD_COLORS[w]||C.light;
    const pc=st.count?Math.round(st.done/st.count*100):0;
    const onMap=!!SYSTEMS[w];
    return '<a class="world-row'+(st.done?'':' todo')+(onMap?'':' offmap-row')+'" href="'+worldLink(w)+'" style="--g:'+g+'">'+
      '<span class="mark" aria-hidden="true"></span>'+
      '<b>'+esc(w)+(onMap?'':'<span class="tag">fuori mappa</span>')+'</b>'+
      '<span class="count">'+st.done+'/'+st.count+'</span>'+
      (WORLD_DESC[w]?'<p>'+esc(WORLD_DESC[w])+'</p>':'')+
      '<span class="wbar" aria-hidden="true"><i style="width:'+pc+'%"></i></span>'+
    '</a>';
  }).join("");
}

function renderPath(){
  const ni=nextIndex(), vis=visibleBooks();
  $("#pathCount").textContent=state.done.length+' / '+BOOKS.length;
  if(worldFilter){
    const st=worldStat(worldFilter);
    $("#filterBar").innerHTML='<div class="filterbar"><span><i class="gem" style="--g:'+(WORLD_COLORS[worldFilter]||C.light)+'"></i>'+esc(worldFilter)+' · '+st.done+'/'+st.count+'</span><button type="button" class="filter-clear" onclick="clearWorldFilter()">Mostra tutti</button></div>';
  } else {
    $("#filterBar").innerHTML='';
  }
  $("#path").innerHTML = vis.length ? vis.map(({b,i})=>{
    const done=isDone(b), w=worldOf(b), now=i===ni;
    return '<div class="book'+(done?' done':'')+(now?' is-next':'')+'">'+
      '<div class="book-num">'+pad(i+1)+'</div>'+
      '<div><div class="book-title">'+esc(b.t)+'</div>'+
      '<div class="meta"><span class="gem" style="--g:'+(WORLD_COLORS[w]||C.light)+'"></span><span class="mt">'+esc(b.w)+' · '+b.y+(b.soon?' · annunciata':'')+(now?' · <span class="now">prossimo</span>':'')+'</span></div></div>'+
      '<div class="book-actions"><a class="buy" href="'+amazonUrl(b.t)+'" target="_blank" rel="noopener noreferrer" aria-label="Cerca '+esc(b.t)+' su Amazon">'+ICON_SEARCH+'</a>'+
      '<button type="button" class="check" aria-label="'+(done?'Segna non letto':'Segna letto')+'" aria-pressed="'+done+'" onclick="toggleDone('+i+')">'+(done?ICON_CHECK:ICON_PLUS)+'</button></div>'+
    '</div>';
  }).join("") : '<p class="empty">Nessun libro per questo filtro.</p>';
}

function renderBlog(){
  $("#blogPosts").innerHTML = BLOG_POSTS.map(p=>
    '<a class="blog-post" href="'+esc(p.u)+'" target="_blank" rel="noopener noreferrer">'+
      '<div><div class="blog-post-date">'+esc(p.d)+'</div><div class="blog-post-title">'+esc(p.t)+'</div><div class="blog-post-excerpt">'+esc(p.n)+'</div></div>'+
      '<span class="blog-post-arrow" aria-hidden="true">→</span>'+
    '</a>'
  ).join("");
}

function render(){
  document.body.classList.toggle("has-progress", state.done.length>0);
  $("#readCount").textContent=pad(state.done.length);
  $("#worldCount").textContent=pad(uniqueWorlds());
  $("#remaining").textContent=pad(BOOKS.length-state.done.length);
  renderChart();
  renderNext();
  renderWorlds();
  renderPath();
  renderBlog();
}

function markDone(i){
  const k=BOOKS[i].key;
  if(!state.done.includes(k)) state.done.push(k);
  save(); render(); toast("Registrato: "+BOOKS[i].t);
}
function toggleDone(i){
  const k=BOOKS[i].key;
  state.done = state.done.includes(k) ? state.done.filter(x=>x!==k) : [...state.done, k];
  save(); render();
}
function resetProgress(){ state.done=[]; save(); render(); toast("Progresso azzerato"); }
let toastTimer;
function toast(t){const x=$("#toast");x.textContent=t;x.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>x.classList.remove("show"),1900)}
function clearWorldFilter(){
  worldFilter=null;
  try{ history.replaceState(null,"",location.pathname+location.search); }catch(_){}
  render();
}
window.addEventListener("hashchange",()=>{ worldFilter=readHashFilter(); render(); });

$("#reset").addEventListener("click",()=>{if(confirm("Vuoi azzerare tutto il progresso?")) resetProgress()});

{{STARTAPP}}
