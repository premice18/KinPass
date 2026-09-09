// Service worker kinPass (Phase 8) — installable et repli hors-ligne minimal.
//
// Stratégie prudente (billeterie = données fraîches) :
//  - les navigations tentent le réseau d'abord, puis le cache de l'app ;
//  - les pages statiques/marketing déjà visitées passent en cache-first
//    uniquement après avoir été vues en ligne (jamais de contenu périmé
//    servi à la place de données récentes).
// Versionnez ce fichier pour invalider l'ancien cache (changement de code).

const CACHE_NAME = 'kinpass-v2'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/manifest.webmanifest'])))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  // Navigations : réseau d'abord, cache (shell) en repli hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          return response
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match('/')),
        ),
    )
    return
  }

  // Ressources statiques déjà mises en cache : cache-first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        // On ne cache que les réponses sûres et de même origine.
        if (response.ok && new URL(request.url).origin === self.location.origin) {
          const copy = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
        }
        return response
      })
    }),
  )
})
