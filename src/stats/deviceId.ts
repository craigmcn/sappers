const STORAGE_KEY = "sappers-device-id";

/**
 * A persistent per-device identifier — the "anonymous account" key. Created
 * once and reused from localStorage; no network call, no login.
 */
export function getDeviceId(): string {
  try {
    const existing = window.localStorage.getItem(STORAGE_KEY);
    if (existing) return existing;

    const id = crypto.randomUUID();
    window.localStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    // localStorage unavailable (private browsing, storage disabled) — fall
    // back to a session-only id rather than blocking gameplay on stats.
    return crypto.randomUUID();
  }
}
