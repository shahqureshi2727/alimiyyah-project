const DEFAULT_TTL_MS = 60_000;
const cache = new Map();

function normalizeForKey(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(normalizeForKey);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, nestedValue]) => nestedValue !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nestedValue]) => [key, normalizeForKey(nestedValue)])
  );
}

export function cacheKey(namespace, params = {}) {
  return `${namespace}:${JSON.stringify(normalizeForKey(params))}`;
}

export async function cachedQuery(key, read, ttlMs = DEFAULT_TTL_MS) {
  const now = Date.now();
  const existing = cache.get(key);

  if (existing && existing.expiresAt > now) {
    return existing.value;
  }

  const value = await read();
  cache.set(key, {
    value,
    expiresAt: now + ttlMs,
  });
  return value;
}

export function invalidateRepositoryCache(prefix) {
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key);
  }
}

export function clearRepositoryCache() {
  cache.clear();
}
