import { get, set, del, keys } from 'idb-keyval';

const PENDING_LISTINGS_PREFIX = 'pending-listing-';

export async function savePendingListing(listing) {
  const id = `${PENDING_LISTINGS_PREFIX}${Date.now()}-${Math.random().toString(36).substring(7)}`;
  await set(id, {
    ...listing,
    pendingId: id,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getPendingListings() {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(PENDING_LISTINGS_PREFIX)
  );
  
  const listings = await Promise.all(
    pendingKeys.map(async key => {
      const listing = await get(key);
      return listing;
    })
  );
  
  return listings.filter(Boolean);
}

export async function removePendingListing(pendingId) {
  await del(pendingId);
}

export async function getPendingCount() {
  const allKeys = await keys();
  return allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(PENDING_LISTINGS_PREFIX)
  ).length;
}

export async function clearAllPendingListings() {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter(key => 
    typeof key === 'string' && key.startsWith(PENDING_LISTINGS_PREFIX)
  );
  
  await Promise.all(pendingKeys.map(key => del(key)));
}

// Register background sync if supported
export async function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-pending-listings');
      return true;
    } catch (error) {
      console.error('Background sync registration failed:', error);
      return false;
    }
  }
  return false;
}
