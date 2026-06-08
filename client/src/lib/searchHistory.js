const STORAGE_KEY = 'gmarkt_search_history';
const MAX_ENTRIES = 5;

export function getSearchHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function addToSearchHistory(query) {
  if (!query || query.trim().length < 2) return;
  const trimmed = query.trim();
  const existing = getSearchHistory().filter(q => q !== trimmed);
  const updated = [trimmed, ...existing].slice(0, MAX_ENTRIES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function removeFromSearchHistory(query) {
  const updated = getSearchHistory().filter(q => q !== query);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
}

export function clearSearchHistory() {
  localStorage.removeItem(STORAGE_KEY);
}
