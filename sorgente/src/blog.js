// Post del blog: snapshot di fallback + caricamento live dal feed Atom ufficiale.
// Il feed viene letto quando l'app parte e poi periodicamente; se il browser blocca
// la richiesta cross-origin, viene provato un proxy CORS e, in ultima istanza,
// resta disponibile lo snapshot locale.
const BLOG_FEED_URL = "https://www.brandonsanderson.com/blogs/blog.atom";
const BLOG_PROXY_URL = "https://api.allorigins.win/raw?url="+encodeURIComponent(BLOG_FEED_URL);
// Worker Cloudflare dedicato al feed (vedi cosmere-feed.js): prima fonte provata.
const BLOG_WORKER_URL = "https://cosmere-feed.proietti-flavio.workers.dev/";

let BLOG_POSTS = [
  {t:"On Fantasy: The J.R.R. Tolkien Lecture on Fantasy Literature", d:"23 giugno 2026", n:"Il testo della sua lecture a Oxford sul genere fantasy.", u:"https://www.brandonsanderson.com/blogs/blog/on-fantasy-tolkien-lecture-oxford-2026"},
  {t:"DSNX26 Featured Guests + Weekly Update", d:"4 giugno 2026", n:"Aggiornamento settimanale e nuovi ospiti annunciati per la Dragonsteel Nexus.", u:"https://www.brandonsanderson.com/blogs/blog/dsnx26-featured-guests-weekly-update"},
  {t:"Meet Me In London & Get A Book Signed! + Weekly Update", d:"29 aprile 2026", n:"Tappa a Londra con possibilità di firma copie, tra un ritiro di scrittura e l'altro.", u:"https://www.brandonsanderson.com/blogs/blog/meet-me-in-london-get-a-book-signed-weekly-update-blog"},
  {t:"What is the Cosmere? — A SanderFAQ", d:"20 aprile 2026", n:"Una spiegazione diretta dall'autore su cosa sia il Cosmere e le sue 16 Schegge.", u:"https://www.brandonsanderson.com/blogs/blog/what-is-the-cosmere-sanderfaq"}
];

const BLOG_CACHE_KEY = "cosmere-blog-cache-v1";

function blogDate(iso){
  const dt = new Date(iso);
  if(Number.isNaN(dt.getTime())) return "";
  return new Intl.DateTimeFormat("it-IT",{day:"numeric",month:"long",year:"numeric"}).format(dt);
}

function cleanBlogText(value){
  const box = document.createElement("div");
  box.innerHTML = value || "";
  return (box.textContent || "").replace(/\s+/g," ").trim();
}

// Questa sezione è solo un rimando al blog vero: l'estratto va troncato
// a una lunghezza fissa, perché alcuni articoli espongono nel feed il
// contenuto intero invece di un breve riassunto.
function truncateBlogText(text, max){
  if(text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max*0.6 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

function parseBlogFeed(xmlText){
  const xml = new DOMParser().parseFromString(xmlText,"application/xml");
  if(xml.querySelector("parsererror")) throw new Error("Feed non valido");

  const entries = [...xml.querySelectorAll("entry, item")];
  if(!entries.length) throw new Error("Nessun articolo nel feed");

  const posts = entries.map(entry=>{
    const title = cleanBlogText(entry.querySelector("title")?.textContent);
    const linkNode = entry.querySelector("link[href]") || entry.querySelector("link");
    const url = linkNode?.getAttribute("href") || linkNode?.textContent?.trim() || "";
    const date = entry.querySelector("published, updated, pubDate, dc\\:date")?.textContent?.trim() || "";
    const summary = cleanBlogText(
      entry.querySelector("summary, description, content, encoded")?.textContent || ""
    );

    return {
      t: title,
      d: blogDate(date),
      n: truncateBlogText(summary || "Nuovo articolo sul blog di Brandon Sanderson.", 140),
      u: url
    };
  }).filter(p=>p.t && /^https:\/\/www\.brandonsanderson\.com\//i.test(p.u));

  if(!posts.length) throw new Error("Feed vuoto");
  return posts.slice(0,5);
}

async function fetchBlogFeed(url){
  const ctrl = new AbortController();
  const timer = setTimeout(()=>ctrl.abort(), 12000);
  let response;
  try{
    response = await fetch(url,{cache:"no-store",signal:ctrl.signal,headers:{"Accept":"application/atom+xml, application/xml, text/xml"}});
  }finally{
    clearTimeout(timer);
  }
  if(!response.ok) throw new Error("HTTP "+response.status);
  return response.text();
}

// Pulsante "Aggiorna": mostra il caricamento e impedisce doppi clic.
let blogLoading = false;
function setBlogBusy(busy){
  const btn = document.getElementById("blogRefresh");
  if(!btn) return;
  btn.disabled = busy;
  btn.classList.toggle("is-loading", busy);
  btn.setAttribute("aria-busy", busy ? "true" : "false");
}

function saveBlogCache(posts){
  try{
    localStorage.setItem(BLOG_CACHE_KEY, JSON.stringify({
      savedAt: Date.now(),
      posts
    }));
  }catch(_){}
}

function loadBlogCache(){
  try{
    const cached = JSON.parse(localStorage.getItem(BLOG_CACHE_KEY)||"null");
    return Array.isArray(cached?.posts) ? cached.posts : null;
  }catch(_){
    return null;
  }
}

// Legge il feed. Con {force:true} (pulsante "Aggiorna") salta la cache
// del proxy e comunica l'esito con un avviso; gli aggiornamenti automatici
// restano silenziosi.
async function loadBlogPosts(opts = {}){
  if(blogLoading) return;
  const force = !!opts.force;
  blogLoading = true;
  setBlogBusy(true);

  const cached = loadBlogCache();
  if(!force && cached?.length){
    BLOG_POSTS = cached;
    render();
  }

  try{
    // Fonti in ordine: il Worker del feed, il feed diretto, il proxy
    // pubblico. Si passa alla successiva se una fallisce o non
    // restituisce un feed valido.
    const sources = [
      force ? BLOG_WORKER_URL + "?fresh=1" : BLOG_WORKER_URL,
      BLOG_FEED_URL,
      force ? BLOG_PROXY_URL + "&t=" + Date.now() : BLOG_PROXY_URL
    ];
    let posts = null, lastError = null;
    for(const src of sources){
      try{ posts = parseBlogFeed(await fetchBlogFeed(src)); break; }
      catch(err){ lastError = err; }
    }
    if(!posts) throw lastError || new Error("Nessuna fonte disponibile");

    BLOG_POSTS = posts;
    saveBlogCache(posts);
    render();
    if(force) toast("Blog aggiornato");
  }catch(error){
    if(force) toast("Blog non raggiungibile: restano gli ultimi post");
    console.warn("Impossibile aggiornare il blog:", error);
  }finally{
    blogLoading = false;
    setBlogBusy(false);
  }
}
