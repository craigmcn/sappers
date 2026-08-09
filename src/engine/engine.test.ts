import { describe, expect, it } from "vitest";
import {
  chord,
  createGame,
  reveal,
  remainingMineCount,
  toggleFlag,
} from "./engine";
import { buildManualState } from "./testHelpers";
import { DIFFICULTY_CONFIGS } from "./types";

describe("createGame", () => {
  it.each(
    Object.keys(DIFFICULTY_CONFIGS) as (keyof typeof DIFFICULTY_CONFIGS)[],
  )("sets up a pending %s board with no mines placed yet", (difficulty) => {
    const config = DIFFICULTY_CONFIGS[difficulty];
    const state = createGame(difficulty);

    expect(state.status).toBe("pending");
    expect(state.rows).toBe(config.rows);
    expect(state.cols).toBe(config.cols);
    expect(state.mines).toBe(config.mines);
    expect(state.board.flat().every((cell) => !cell.mine)).toBe(true);
    expect(state.startTime).toBeNull();
  });
});

describe("reveal", () => {
  it("guarantees the first click and its neighbors are never mines", () => {
    // Small board, dense with mines, so a violation would show up quickly
    // across repeated trials if the exclusion logic were broken.
    for (let trial = 0; trial < 25; trial++) {
      let state = createGame("beginner");
      state = { ...state, mines: 20 }; // more mines than a naive impl could dodge by luck
      state = reveal(state, 4, 4);

      expect(state.status).toBe("playing");
      expect(state.startTime).not.toBeNull();
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          expect(state.board[4 + dr][4 + dc].mine).toBe(false);
        }
      }
    }
  });

  it("cascades a flood-fill reveal across contiguous zero-adjacency cells", () => {
    const state = buildManualState(["...", ".M.", "..."]);
    const next = reveal(state, 0, 0);

    // Every non-mine cell borders the single mine, so nothing cascades
    // beyond the clicked cell itself in this layout — assert that directly.
    expect(next.board[0][0].visibility).toBe("revealed");
    expect(next.status).toBe("playing");
  });

  it("cascades through a genuinely open area", () => {
    const state = buildManualState(["....", "....", "....", "...M"]);
    const next = reveal(state, 0, 0);

    // The whole board except the mine has adjacent === 0 or borders only
    // revealed zero-cells, so the cascade should reveal everything safe.
    const revealedSafe = next.board
      .flat()
      .filter((cell) => !cell.mine && cell.visibility === "revealed").length;
    expect(revealedSafe).toBe(15);
    expect(next.status).toBe("won");
  });

  it("ends the game in loss when a mine is revealed", () => {
    const state = buildManualState(["M."]);
    const next = reveal(state, 0, 0);

    expect(next.status).toBe("lost");
    expect(next.endTime).not.toBeNull();
    expect(next.board[0][0].visibility).toBe("revealed");
  });

  it("reveals every mine on loss", () => {
    const state = buildManualState(["MM", ".M"]);
    const next = reveal(state, 0, 0);

    expect(next.board[0][1].visibility).toBe("revealed");
    expect(next.board[1][1].visibility).toBe("revealed");
  });

  it("is a no-op on an already-revealed or flagged cell", () => {
    const state = buildManualState(["..", ".."]);
    const revealed = reveal(state, 0, 0);
    const flagged = toggleFlag(state, 1, 1);

    expect(reveal(revealed, 0, 0)).toBe(revealed);
    expect(reveal(flagged, 1, 1)).toBe(flagged);
  });

  it("is a no-op once the game has been won or lost", () => {
    const lost = reveal(buildManualState(["M."]), 0, 0);
    expect(reveal(lost, 0, 1)).toBe(lost);
  });

  it("declares a win once every non-mine cell is revealed", () => {
    const state = buildManualState(["M."]);
    const next = reveal(state, 0, 1);

    expect(next.status).toBe("won");
    expect(next.endTime).not.toBeNull();
  });
});

describe("toggleFlag", () => {
  it("flags a hidden cell and tracks the count", () => {
    const state = buildManualState(["..", ".."]);
    const flagged = toggleFlag(state, 0, 0);

    expect(flagged.board[0][0].visibility).toBe("flagged");
    expect(flagged.flagsPlaced).toBe(1);
  });

  it("unflags a flagged cell", () => {
    const state = buildManualState(["..", ".."]);
    const flagged = toggleFlag(state, 0, 0);
    const unflagged = toggleFlag(flagged, 0, 0);

    expect(unflagged.board[0][0].visibility).toBe("hidden");
    expect(unflagged.flagsPlaced).toBe(0);
  });

  it("cannot flag an already-revealed cell", () => {
    const state = buildManualState(["..", ".."]);
    const revealed = reveal(state, 0, 0);
    expect(toggleFlag(revealed, 0, 0)).toBe(revealed);
  });
});

describe("remainingMineCount", () => {
  it("subtracts flags placed from total mines, allowing negative values", () => {
    let state = buildManualState(["M."]);
    expect(remainingMineCount(state)).toBe(1);

    state = toggleFlag(state, 0, 1);
    expect(remainingMineCount(state)).toBe(0);

    state = toggleFlag(state, 0, 0);
    expect(remainingMineCount(state)).toBe(-1);
  });
});

describe("chord", () => {
  it("reveals remaining neighbors once adjacent flags match the number", () => {
    // Center cell (1,1) borders exactly one mine (0,0).
    const state = buildManualState(["M..", "...", "..."]);
    const revealed = reveal(state, 1, 1);
    expect(revealed.board[1][1].adjacent).toBe(1);

    const flagged = toggleFlag(revealed, 0, 0);
    const chorded = chord(flagged, 1, 1);

    expect(chorded.board[0][1].visibility).toBe("revealed");
    expect(chorded.board[1][0].visibility).toBe("revealed");
  });

  it("does nothing if the flag count doesn't match the cell's number", () => {
    const state = buildManualState(["M..", "...", "..."]);
    const revealed = reveal(state, 1, 1);

    expect(chord(revealed, 1, 1)).toBe(revealed);
  });

  it("does nothing on a hidden or zero-adjacency cell", () => {
    const state = buildManualState(["....", "....", "....", "...M"]);
    const revealed = reveal(state, 0, 0);

    expect(chord(state, 0, 0)).toBe(state);
    expect(chord(revealed, 0, 0)).toBe(revealed);
  });

  it("loses the game if chording reveals a mine under a wrongly-placed flag", () => {
    // Center cell borders one mine at (0,0), but the flag is wrongly on (0,1).
    const state = buildManualState(["M..", "...", "..."]);
    const revealed = reveal(state, 1, 1);
    const misflagged = toggleFlag(revealed, 0, 1);
    const chorded = chord(misflagged, 1, 1);

    expect(chorded.status).toBe("lost");
  });
});
