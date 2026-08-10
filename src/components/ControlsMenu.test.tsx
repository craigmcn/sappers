import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getFeedbackSettings } from "../feedback/settings";
import { ControlsMenu } from "./ControlsMenu";

describe("ControlsMenu feedback settings", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("toggles and persists the Haptics/Sound checkboxes", async () => {
    const user = userEvent.setup();
    render(
      <ControlsMenu
        difficulty="beginner"
        summary={null}
        onNewGame={vi.fn()}
        onChangeDifficulty={vi.fn()}
      />,
    );

    const haptics = screen.getByRole("checkbox", { name: "Haptics" });
    const sound = screen.getByRole("checkbox", { name: "Sound" });
    expect(haptics).toBeChecked();
    expect(sound).toBeChecked();

    await user.click(haptics);
    await user.click(sound);

    expect(haptics).not.toBeChecked();
    expect(sound).not.toBeChecked();
    expect(getFeedbackSettings()).toEqual({ haptics: false, sound: false });
  });
});
