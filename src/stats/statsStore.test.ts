// @vitest-environment node
//
// Forced to the plain node environment (rather than this project's default
// happy-dom): happy-dom's window doesn't implement IndexedDB at all, and in
// practice fake-indexeddb's globalThis polyfill didn't reliably wire up
// through happy-dom's global proxying — requests never resolved, timing out
// every test. Node's own indexedDB global is likewise absent, so
// fake-indexeddb/auto has a clean slot to attach to here.
import "fake-indexeddb/auto";
import { openDB } from "idb";
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

  it("keeps stats scoped to the current device", async () => {
    await store.recordResult("beginner", {
      won: true,
      elapsedMs: 5_000,
      timestamp: 1,
    });

    // Insert a record for a different device directly, bypassing
    // recordResult (which always stamps the current device's id) — the
    // only way to simulate "another device" against the same local store.
    const db = await openDB("sappers-stats", 2);
    await db.add("results", {
      difficulty: "beginner",
      deviceId: "some-other-device",
      won: true,
      elapsedMs: 1_000,
      timestamp: 2,
    });
    db.close();

    expect((await store.getSummary("beginner")).played).toBe(1);
  });

  it("upgrades an existing v1 database without losing prior records", async () => {
    // Simulate a real pre-migration user: v1 schema (single "byDifficulty"
    // index, no device-scoping), with one already-recorded result.
    const legacyDb = await openDB("sappers-stats", 1, {
      upgrade(db) {
        const legacyStore = db.createObjectStore("results", {
          keyPath: "id",
          autoIncrement: true,
        });
        legacyStore.createIndex("byDifficulty", "difficulty");
      },
    });
    await legacyDb.add("results", {
      difficulty: "beginner",
      deviceId: "legacy-device",
      won: true,
      elapsedMs: 12_000,
      timestamp: 1,
    });
    legacyDb.close();

    // The first real open (via the store) triggers the v1 -> v2 upgrade.
    // The legacy record belongs to a different device, so it's correctly
    // excluded from this device's summary post-migration...
    expect((await store.getSummary("beginner")).played).toBe(0);

    // ...but the migration itself must not have dropped it.
    const db = await openDB("sappers-stats", 2);
    expect(await db.count("results")).toBe(1);
    db.close();
  });
});
