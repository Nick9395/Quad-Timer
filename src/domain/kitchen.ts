import { isValidCountdownMs, remainingMs } from "./clock";
import { MAX_COUNTDOWN_MS, MAX_KITCHEN_PRESETS, MAX_KITCHEN_TIMERS } from "./limits";

export type KitchenTimer = {
  id: string;
  durationMs: number;
  endAt: number;
  /** 一時停止中の残り。null なら走行中 */
  pausedRemainingMs: number | null;
};

export type KitchenAddError = "empty" | "invalid" | "full";

export function rememberPreset(
  presets: readonly number[],
  durationMs: number,
  max = MAX_KITCHEN_PRESETS,
): number[] {
  return [durationMs, ...presets.filter((item) => item !== durationMs)].slice(
    0,
    max,
  );
}

export function canAddKitchenTimer(count: number): boolean {
  return count < MAX_KITCHEN_TIMERS;
}

export function validateKitchenDuration(durationMs: number): KitchenAddError | null {
  if (durationMs <= 0) {
    return "empty";
  }
  if (!isValidCountdownMs(durationMs, MAX_COUNTDOWN_MS)) {
    return "invalid";
  }
  return null;
}

export function createKitchenTimer(
  durationMs: number,
  now: number,
  id: string,
): KitchenTimer {
  return { id, durationMs, endAt: now + durationMs, pausedRemainingMs: null };
}

export function isKitchenPaused(timer: KitchenTimer): boolean {
  return timer.pausedRemainingMs !== null;
}

export function kitchenRemainingMs(timer: KitchenTimer, now: number): number {
  if (timer.pausedRemainingMs !== null) {
    return timer.pausedRemainingMs;
  }
  return remainingMs(timer.endAt, now);
}

export function pauseKitchenTimerAt(
  timer: KitchenTimer,
  now: number,
): KitchenTimer {
  if (timer.pausedRemainingMs !== null || now >= timer.endAt) {
    return timer;
  }
  return { ...timer, pausedRemainingMs: remainingMs(timer.endAt, now) };
}

export function resumeKitchenTimerAt(
  timer: KitchenTimer,
  now: number,
): KitchenTimer {
  if (timer.pausedRemainingMs === null) {
    return timer;
  }
  return {
    ...timer,
    endAt: now + timer.pausedRemainingMs,
    pausedRemainingMs: null,
  };
}

/** まだ鳴っていない・一時停止していないもののうち、いちばん近い1本 */
export function soonestKitchenTimer(
  timers: readonly KitchenTimer[],
  now: number,
): KitchenTimer | undefined {
  const pending = timers.filter(
    (timer) => timer.pausedRemainingMs === null && timer.endAt > now,
  );
  if (pending.length === 0) {
    return undefined;
  }
  return pending.reduce((earliest, timer) =>
    timer.endAt < earliest.endAt ? timer : earliest,
  );
}

export function isKitchenRinging(timer: KitchenTimer, now: number): boolean {
  return timer.pausedRemainingMs === null && now >= timer.endAt;
}
