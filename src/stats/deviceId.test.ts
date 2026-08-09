import { beforeEach, describe, expect, it } from "vitest";
import { getDeviceId } from "./deviceId";

describe("getDeviceId", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("generates and persists an id on first call", () => {
    const id = getDeviceId();
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(window.localStorage.getItem("sappers-device-id")).toBe(id);
  });

  it("returns the same id on subsequent calls", () => {
    const first = getDeviceId();
    const second = getDeviceId();
    expect(second).toBe(first);
  });
});
