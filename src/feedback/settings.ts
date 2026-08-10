const STORAGE_KEY = "sappers-feedback-settings";

export interface FeedbackSettings {
  haptics: boolean;
  sound: boolean;
}

const DEFAULT_SETTINGS: FeedbackSettings = { haptics: true, sound: true };

/**
 * Local-only feedback preferences (haptics/sound on long-press flag and the
 * loss shake), persisted the same way as the device id in
 * src/stats/deviceId.ts — no login, just localStorage, defaulting to "on"
 * when unavailable (private browsing, storage disabled) rather than
 * blocking gameplay.
 */
export function getFeedbackSettings(): FeedbackSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_SETTINGS;
    const candidate = parsed as Partial<FeedbackSettings>;
    return {
      haptics:
        typeof candidate.haptics === "boolean"
          ? candidate.haptics
          : DEFAULT_SETTINGS.haptics,
      sound:
        typeof candidate.sound === "boolean"
          ? candidate.sound
          : DEFAULT_SETTINGS.sound,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setFeedbackSettings(settings: FeedbackSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable — setting just won't persist across sessions.
  }
}
