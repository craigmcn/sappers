// @vitest-environment node
//
// Forced to the plain node environment (rather than this project's default
// happy-dom): happy-dom's window doesn't implement IndexedDB at all, and in
// practice fake-indexeddb's globalThis polyfill didn't reliably wire up
// through happy-dom's global proxying — requests never resolved, timing out
// every test. Node's own indexedDB global is likewise absent, so
// fake-indexeddb/auto has a clean slot to attach to here.
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { IndexedDbStatsStore } from "./statsStore";

describe("IndexedDbStatsStore", () => {
  let store: IndexedDbStatsStore;

  beforeEach(() => {
    store = new IndexedDbStatsStore();
  });

  // deleteDatabase blocks until every open connection closes, so the
  // previous test's connection must be closed first or this hangs.
  afterEach(async () => {
    await store.close();
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("sappers-stats");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  });

  it("reports an empty summary before any results are recorded", async () => {
    const summary = await store.getSummary("beginner");
    expect(summary).toEqual({
      played: 0,
      won: 0,
      bestTimeMs: null,
      currentStreak: 0,
    });
  });

  it("tracks played/won counts and best time across wins", async () => {
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 45_000,
      timestamp: 1,
    });
    await store.recordResult("beginner", {
      won: false,
      elapsedMs: 10_000,
      timestamp: 2,
    });
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 30_000,
      timestamp: 3,
    });

    const summary = await store.getSummary("beginner");
    expect(summary.played).toBe(3);
    expect(summary.won).toBe(2);
    expect(summary.bestTimeMs).toBe(30_000);
  });

  it("keeps difficulties separate", async () => {
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 10_000,
      timestamp: 1,
    });
    await store.recordResult("expert", {
      won: false,
      elapsedMs: 5_000,
      timestamp: 2,
    });

    expect((await store.getSummary("beginner")).played).toBe(1);
    expect((await store.getSummary("expert")).played).toBe(1);
    expect((await store.getSummary("intermediate")).played).toBe(0);
  });

  it("computes the current win streak from the most recent result backward", async () => {
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 1,
      timestamp: 1,
    });
    await store.recordResult("beginner", {
      won: false,
      elapsedMs: 1,
      timestamp: 2,
    });
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 1,
      timestamp: 3,
    });
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 1,
      timestamp: 4,
    });

    expect((await store.getSummary("beginner")).currentStreak).toBe(2);
  });

  it("resets the streak to zero after a most-recent loss", async () => {
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 1,
      timestamp: 1,
    });
    await store.recordResult("beginner", {
      won: false,
      elapsedMs: 1,
      timestamp: 2,
    });

    expect((await store.getSummary("beginner")).currentStreak).toBe(0);
  });
});
