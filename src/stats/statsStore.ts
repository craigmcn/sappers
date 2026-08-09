import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Difficulty } from "../engine/types";
import { getDeviceId } from "./deviceId";

export interface GameResult {
  won: boolean;
  elapsedMs: number;
  timestamp: number;
}

export interface DifficultySummary {
  played: number;
  won: number;
  bestTimeMs: number | null;
  currentStreak: number;
}

export interface StatsStore {
  recordResult(difficulty: Difficulty, result: GameResult): Promise<void>;
  getSummary(difficulty: Difficulty): Promise<DifficultySummary>;
}

interface StoredResult extends GameResult {
  id?: number;
  deviceId: string;
  difficulty: Difficulty;
}

interface SappersDB extends DBSchema {
  results: {
    key: number;
    value: StoredResult;
    indexes: { byDifficultyAndDevice: [Difficulty, string] };
  };
}

const DB_NAME = "sappers-stats";
const DB_VERSION = 2;
const STORE = "results";
const BY_DIFFICULTY_AND_DEVICE = "byDifficultyAndDevice";

function summarize(results: StoredResult[]): DifficultySummary {
  const sorted = [...results].sort((a, b) => b.timestamp - a.timestamp);
  const wins = sorted.filter((r) => r.won);
  const bestTimeMs =
    wins.length > 0 ? Math.min(...wins.map((r) => r.elapsedMs)) : null;

  let currentStreak = 0;
  for (const result of sorted) {
    if (!result.won) break;
    currentStreak++;
  }

  return {
    played: sorted.length,
    won: wins.length,
    bestTimeMs,
    currentStreak,
  };
}

/**
 * Anonymous, device-scoped, local-only stats storage. Kept behind the
 * StatsStore interface so a future login/sync backend can be swapped in
 * without touching engine or UI code.
 */
export class IndexedDbStatsStore implements StatsStore {
  private dbPromise: Promise<IDBPDatabase<SappersDB>> | null = null;

  private getDb(): Promise<IDBPDatabase<SappersDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<SappersDB>(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, _newVersion, transaction) {
          const store =
            oldVersion < 1
              ? db.createObjectStore(STORE, {
                  keyPath: "id",
                  autoIncrement: true,
                })
              : transaction.objectStore(STORE);

          if (oldVersion < 2) {
            // Pre-v2 databases have a "byDifficulty" index that isn't part
            // of the current schema type, so indexNames is cast to the
            // plain DOM type to check for it.
            if ((store.indexNames as DOMStringList).contains("byDifficulty")) {
              store.deleteIndex("byDifficulty");
            }
            store.createIndex(BY_DIFFICULTY_AND_DEVICE, [
              "difficulty",
              "deviceId",
            ]);
          }
        },
      });
    }
    return this.dbPromise;
  }

  /** Closes the underlying connection. Real pages never need this — it exists so tests can delete/recreate the database between cases without deadlocking on a lingering open connection. */
  async close(): Promise<void> {
    if (!this.dbPromise) return;
    const db = await this.dbPromise;
    db.close();
    this.dbPromise = null;
  }

  async recordResult(
    difficulty: Difficulty,
    result: GameResult,
  ): Promise<void> {
    const db = await this.getDb();
    const record: StoredResult = {
      ...result,
      difficulty,
      deviceId: getDeviceId(),
    };
    await db.add(STORE, record);
  }

  async getSummary(difficulty: Difficulty): Promise<DifficultySummary> {
    const db = await this.getDb();
    const results = await db.getAllFromIndex(STORE, BY_DIFFICULTY_AND_DEVICE, [
      difficulty,
      getDeviceId(),
    ]);
    return summarize(results);
  }
}
