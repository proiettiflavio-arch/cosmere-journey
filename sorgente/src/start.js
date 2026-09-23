// Avvio app + splash.
// Lo splash è un vero elemento HTML, quindi viene mostrato anche in un normale
// browser: non dipende dal manifest né dai meccanismi di startup di iOS.
function startApp(){
  const splash = document.getElementById("splash");
  const startedAt = performance.now();

  // Renderizziamo la Home durante la splash: quando questa scompare,
  // l'app è già pronta e la transizione non mostra contenuti "a vuoto".
  render();
  // Il feed serve solo nella pagina Blog: le altre pagine non fanno richieste di rete.
  if(document.body.dataset.page === "blog"){
    loadBlogPosts();
    window.setInterval(loadBlogPosts, 15 * 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if(document.visibilityState === "visible") loadBlogPosts();
    });
    const refresh = document.getElementById("blogRefresh");
    if(refresh) refresh.addEventListener("click", () => loadBlogPosts({force:true}));
  }

  const earlyPaint = document.getElementById("splash-early-paint");
  if(earlyPaint) earlyPaint.remove();

  if(!splash) return;

  // Non e' la prima apertura: nessuna animazione, l'elemento esce dal DOM.
  if(!document.documentElement.classList.contains("splash-first-load")){
    splash.remove();
    return;
  }

  const MIN_SPLASH_MS = 1450;

  const hideSplash = () => {
    splash.classList.add("is-hidden");
    window.setTimeout(() => splash.remove(), 750);
  };

  const elapsed = performance.now() - startedAt;
  window.setTimeout(hideSplash, Math.max(0, MIN_SPLASH_MS - elapsed));
}

if(document.readyState === "loading"){
  document.addEventListener("DOMContentLoaded", startApp, {once:true});
}else{
  startApp();
}
