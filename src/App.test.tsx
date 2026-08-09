import "fake-indexeddb/auto";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
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
