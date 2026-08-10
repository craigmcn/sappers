import { playTone, primeAudio } from "./audio";
import { reducedMotionPreferred, vibrate } from "./haptics";
import { getFeedbackSettings } from "./settings";

/**
 * Call synchronously from the touchstart/pointerdown handler that starts the
 * long-press timer, so the AudioContext is unlocked before playFlagFeedback()
 * runs from inside that timer's setTimeout callback — see primeAudio().
 */
export function primeFlagFeedbackAudio(): void {
  if (getFeedbackSettings().sound) primeAudio();
}

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
