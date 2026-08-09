const STORAGE_KEY = "sappers-device-id";

let cachedId: string | null = null;

/**
 * A persistent per-device identifier — the "anonymous account" key. Created
 * once and reused from localStorage; no network call, no login. Memoized
 * per page-load: without this, the private-browsing/storage-disabled
 * fallback below would mint a *different* random id on every call, so a
 * result recorded under one id could never be found again under another.
 */
export function getDeviceId(): string {
  if (cachedId) return cachedId;

  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) {
      cachedId = existing;
      return cachedId;
    }

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    cachedId = id;
    return cachedId;
  } catch {
    // localStorage unavailable (private browsing, storage disabled) — fall
    // back to a session-only id rather than blocking gameplay on stats.
    cachedId = crypto.randomUUID();
    return cachedId;
  }
}
