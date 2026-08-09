import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    indexedDB.deleteDatabase("sappers-stats");
  });

  it("has no detectable accessibility violations", async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no detectable accessibility violations with the mobile menu open", async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);

    await user.click(screen.getByRole("button", { name: /menu/i }));

    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no detectable accessibility violations on the loss overlay", async () => {
    // With Math.random mocked to a fixed value, mine placement is
    // deterministic. 0.1 was verified (see engine tests' RNG-injection
    // pattern) to give a Beginner (9x9) board a small, contained cascade
    // from (0,0) — leaving (0,2) hidden as a mine — rather than the
    // whole-board cascade a naive constant like 0 can produce.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);
    try {
      const user = userEvent.setup();
      const { container } = render(<App />);

      const cells = document.querySelectorAll<HTMLButtonElement>(".cell");
      await user.click(cells[0]);
      await user.click(cells[2]);

      expect(screen.getByText("Detonated")).toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      randomSpy.mockRestore();
    }
  });

  it("starts in the Ready state with the Beginner board size", () => {
    render(<App />);
    expect(screen.getByText("Ready")).toBeInTheDocument();
    // Beginner is 9x9 = 81 cells.
    expect(document.querySelectorAll(".cell")).toHaveLength(81);
  });

  it("reveals a cell on click and starts the timer", async () => {
    const user = userEvent.setup();
    render(<App />);

    const cells = document.querySelectorAll<HTMLButtonElement>(".cell");
    await user.click(cells[40]); // center of the 9x9 board

    expect(screen.getByText("Clearing")).toBeInTheDocument();
  });

  it("flags a cell via context menu without revealing it", async () => {
    const user = userEvent.setup();
    render(<App />);

    const cell = document.querySelectorAll<HTMLButtonElement>(".cell")[0];
    await user.pointer({ keys: "[MouseRight]", target: cell });

    expect(cell.className).toContain("cell--flagged");
  });

  it("switches board size when a different clearance level is chosen", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("radio", { name: /demolitions/i }));

    // Expert is 16x30 = 480 cells.
    expect(document.querySelectorAll(".cell")).toHaveLength(480);
  });

  it("resets the board when New Field is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);

    const cells = document.querySelectorAll<HTMLButtonElement>(".cell");
    await user.click(cells[40]);
    expect(screen.getByText("Clearing")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /new field/i }));
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
