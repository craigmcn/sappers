import { beforeEach, describe, expect, it } from "vitest";
import { getFeedbackSettings, setFeedbackSettings } from "./settings";

const STORAGE_KEY = "sappers-feedback-settings";

describe("feedback settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("defaults to haptics and sound both on when nothing is stored", () => {
    expect(getFeedbackSettings()).toEqual({ haptics: true, sound: true });
  });

  it("round-trips a stored value", () => {
    setFeedbackSettings({ haptics: false, sound: true });
    expect(getFeedbackSettings()).toEqual({ haptics: false, sound: true });
  });

  it("falls back to defaults for malformed stored JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "not json");
    expect(getFeedbackSettings()).toEqual({ haptics: true, sound: true });
  });

  it("falls back per-field when stored value is missing a key", () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound: false }));
    expect(getFeedbackSettings()).toEqual({ haptics: true, sound: false });
  });
});
