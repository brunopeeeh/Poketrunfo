/* PokéTrunfo - Service Worker
 *
 * Estratégia:
 *  - App shell (HTML, CSS, JS, imagens locais): pré-cache na instalação e
 *    cache-first depois. Mudou algo? Suba CACHE_VERSION que o SW antigo é
 *    descartado no activate.
 *  - Artes dos Pokémon e fontes (CDNs externos): NÃO são interceptadas.
 *    O SW responder por elas colocava a requisição atrás de um fetch dentro
 *    do worker; com rede ruim ou indisponível a imagem fica pendurada em vez
 *    de falhar rápido e cair no onerror (que tenta o sprite menor). O cache
 *    HTTP normal do navegador já cuida bem dessas imagens, então o SW fica
 *    fora do caminho delas.
 */
const CACHE_VERSION = 'v2';
const SHELL_CACHE = `poketrunfo-shell-${CACHE_VERSION}`;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/main.css',
  './css/cards.css',
  './css/coin.css',
  './js/ui.js',
  './js/game.js',
  './js/state.js',
  './js/api.js',
  './js/types.js',
  './js/storage.js',
  './js/audio.js',
  './js/i18n.js',
  './js/npcs.js',
  './logo.png',
  './poke_trunfo_logo-removebg-preview.png',
  './verso.jpg',
  './image.png',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      // addAll falha inteiro se um arquivo falhar; aqui cada um é opcional
      .then(cache => Promise.allSettled(SHELL_FILES.map(f => cache.add(f))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Só a própria origem. Tudo que é externo segue o caminho normal do
  // navegador, sem o SW no meio.
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(cacheFirst(req, SHELL_CACHE));
});

async function cacheFirst(req, cacheName) {
  const cached = await caches.match(req, { ignoreSearch: true });
  if (cached) return cached;
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(req, res.clone());
    }
    return res;
  } catch (err) {
    // Navegação offline sem cache: devolve o index (SPA de tela única)
    if (req.mode === 'navigate') {
      const fallback = await caches.match('./index.html');
      if (fallback) return fallback;
    }
    throw err;
  }
}
