/*
  Service worker: guarda la app para que funcione sin conexion.

  IMPORTANTE: si algun dia editas index.html, sube el numero de VERSION.
  Si no lo haces, el movil seguira sirviendo la version vieja de la cache
  y pensaras que tus cambios no han hecho nada.
*/
var VERSION = "gymlog-v1";
var ARCHIVOS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./iconos/icono-192.png",
  "./iconos/icono-512.png",
  "./iconos/icono-180.png"
];

self.addEventListener("install", function(ev){
  ev.waitUntil(
    caches.open(VERSION).then(function(c){ return c.addAll(ARCHIVOS); })
          .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(ev){
  ev.waitUntil(
    caches.keys().then(function(claves){
      return Promise.all(claves.map(function(k){
        if(k !== VERSION) return caches.delete(k);
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Primero la cache: la app abre al instante y no depende de la red. */
self.addEventListener("fetch", function(ev){
  if(ev.request.method !== "GET") return;
  ev.respondWith(
    caches.match(ev.request).then(function(r){
      return r || fetch(ev.request).then(function(resp){
        return caches.open(VERSION).then(function(c){
          try{ c.put(ev.request, resp.clone()); }catch(e){}
          return resp;
        });
      }).catch(function(){ return caches.match("./index.html"); });
    })
  );
});
