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
  ({ request, url }) => url.pathname.match(/^\/api\/(listings|zones|categories)/) && request.method === 'GET',
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
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${listing.token || ''}`
        },
        body: JSON.stringify(listing)
      });
      
      if (response.ok) {
        await del(key);
      }
    } catch (err) {
      console.error('Failed to sync listing', listing, err);
    }
  }
}

self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-listings') {
    event.waitUntil(syncPendingListings());
  }
});
