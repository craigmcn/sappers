import { playTone } from "./audio";
import { reducedMotionPreferred, vibrate } from "./haptics";
import { getFeedbackSettings } from "./settings";

/** Fired when a flag is placed/removed by touch long-press — see #26. */
export function playFlagFeedback(): void {
  const { haptics, sound } = getFeedbackSettings();
  if (haptics && !reducedMotionPreferred()) vibrate(15);
  if (sound) playTone(880, 70);
}

/** Fired alongside the board's loss shake animation — see #28. */
export function playLossFeedback(): void {
  const { haptics } = getFeedbackSettings();
  if (haptics && !reducedMotionPreferred()) vibrate([40, 60, 40, 60, 80]);
}
