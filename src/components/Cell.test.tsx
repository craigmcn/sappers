import { fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Cell as CellData } from "../engine/types";
import { Cell } from "./Cell";

const hiddenCell: CellData = {
  visibility: "hidden",
  mine: false,
  adjacent: 0,
};

describe("Cell", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flags once on a touch long-press, even if the browser also fires a native contextmenu", () => {
    const onFlag = vi.fn();
    const { getByRole } = render(
      <Cell
        cell={hiddenCell}
        row={0}
        col={0}
        gameOver={false}
        tabIndex={0}
        onReveal={vi.fn()}
        onFlag={onFlag}
        onChord={vi.fn()}
        onCellFocus={vi.fn()}
      />,
    );
    const button = getByRole("gridcell");

    fireEvent.pointerDown(button, { pointerType: "touch" });
    vi.advanceTimersByTime(500);
    // Mobile browsers fire a native contextmenu on long-press independent
    // of the app's own timer (see #15) — it should be a no-op here.
    fireEvent.contextMenu(button);

    expect(onFlag).toHaveBeenCalledTimes(1);
  });

  it("still flags via right-click on desktop (mouse pointer)", () => {
    const onFlag = vi.fn();
    const { getByRole } = render(
      <Cell
        cell={hiddenCell}
        row={0}
        col={0}
        gameOver={false}
        tabIndex={0}
        onReveal={vi.fn()}
        onFlag={onFlag}
        onChord={vi.fn()}
        onCellFocus={vi.fn()}
      />,
    );
    const button = getByRole("gridcell");

    fireEvent.pointerDown(button, { pointerType: "mouse" });
    fireEvent.contextMenu(button);

    expect(onFlag).toHaveBeenCalledTimes(1);
  });
});
