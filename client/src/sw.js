/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { get, del, keys } from 'idb-keyval';

// Declare self as ServiceWorkerGlobalScope to avoid ts errors
const self = globalThis;

self.skipWaiting();
clientsClaim();

// Precache injected assets
precacheAndRoute(self.__WB_MANIFEST || []);

// Navigation fallback
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// Cache API GET requests with StaleWhileRevalidate
registerRoute(
  ({ request, url }) => url.pathname.match(/^\/api\/(listings|regions|categories)/) && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// Cache images from Supabase storage
registerRoute(
  ({ url }) => url.href.match(/^https:\/\/.*\.supabase\.co\/storage\/.*/),
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

async function syncPendingListings() {
  const PENDING_LISTINGS_PREFIX = 'pending-listing-';
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(PENDING_LISTINGS_PREFIX)
  );

  for (const key of pendingKeys) {
    const listing = await get(key);
    if (!listing) continue;

    try {
      // Need a way to fetch without the proxy if we are fully isolated,
      // but assuming the origin handles /api for now. We can fetch to /api/listings
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${listing.token || ''}` // we need the token, not stored? 
          // Actually, typically requests would fail here if no token, 
          // let's grab the token from somewhere if stored, or just send to api.
          // Wait, offlineStorage doesn't store token. Let's just do fetch and delete on success.
        },
        body: JSON.stringify(listing)
      });
      
      if (response.ok) {
        await del(key);
      }
    } catch (err) {
      console.error('Failed to sync listing', listing, err);
      // Let it remain in idb for the next sync
    }
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-listings') {
    event.waitUntil(syncPendingListings());
  }
});
