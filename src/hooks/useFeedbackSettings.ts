import { useState } from "react";
import {
  getFeedbackSettings,
  setFeedbackSettings,
  type FeedbackSettings,
} from "../feedback/settings";

export function useFeedbackSettings(): FeedbackSettings & {
  setHaptics: (value: boolean) => void;
  setSound: (value: boolean) => void;
} {
  const [settings, setSettings] = useState<FeedbackSettings>(() =>
    getFeedbackSettings(),
  );

  const update = (patch: Partial<FeedbackSettings>) => {
    const next = { ...settings, ...patch };
    setFeedbackSettings(next);
    setSettings(next);
  };

  return {
    ...settings,
    setHaptics: (value: boolean) => update({ haptics: value }),
    setSound: (value: boolean) => update({ sound: value }),
  };
}
