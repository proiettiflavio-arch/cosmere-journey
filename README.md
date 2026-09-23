# Cosmere Journey

Webapp per seguire la lettura del Cosmere di Brandon Sanderson in ordine di pubblicazione.
Pubblicata su https://cosmerejourney.proietti-flavio.workers.dev/

## Struttura
- `public/` — le quattro pagine pubblicate (Home, Blog, Mondi, Percorso). Ogni push su `main` le ripubblica tramite Cloudflare Workers Builds.
- `wrangler.jsonc` — configurazione del Worker `cosmerejourney`.
- `sorgente/` — da qui si rigenerano le pagine:
  `python3 sorgente/build.py sorgente/base-v3.html public`
  - `src/` template (CSS, markup, logica, blog, avvio)
  - `base-v3.html` versione di partenza da cui la build prende elenco libri, manifest e splash
  - `icone/` icone e immagini di avvio
  - `worker-feed/cosmere-feed.js` codice del Worker `cosmere-feed` (proxy del feed del blog, pubblicato a parte)
