// ════════════════════════════════════════════════════════════════════
//  TempClean — Service Worker
//  ⚠️ Change VERSION à chaque déploiement → force la MàJ sur tous les appareils
// ════════════════════════════════════════════════════════════════════

const VERSION = 'v2.0.0'; // ← INCRÉMENTER À CHAQUE PUSH (v2.0.1, v2.1.0...)
const CACHE_NAME = 'tempclean-' + VERSION;

const ASSETS = [
  './',
  './tempclean.html',
  './logo.png'
];

// ── Install : mise en cache ───────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()) // ← Active immédiatement sans attendre
  );
});

// ── Activate : supprime les ANCIENS caches (dont tempclean-v1) ────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME) // supprime tout sauf la version actuelle
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // prend contrôle de tous les onglets ouverts
  );
});

// ── Fetch : Network First ─────────────────────────────────────────
// Réseau en priorité → toujours la version la plus récente
// Fallback cache uniquement si hors-ligne
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('script.google.com')) return; // GAS jamais en cache

  event.respondWith(
    fetch(event.request)
      .then(resp => {
        if (resp && resp.status === 200) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(event.request)) // hors-ligne → cache
  );
});

// ── Message depuis l'app (bouton "Mettre à jour") ─────────────────
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
