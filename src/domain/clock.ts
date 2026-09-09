/** カウントダウン／表示用の時間計算。本体は常にミリ秒。 */

export function hmsToMs(hours: number, minutes: number, seconds: number): number {
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function msToHms(ms: number): { h: number; m: number; s: number } {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  return {
    h: Math.floor(totalSec / 3600),
    m: Math.floor(totalSec / 60) % 60,
    s: totalSec % 60,
  };
}

export function remainingMs(endAt: number, now: number): number {
  return Math.max(0, endAt - now);
}

export function isValidCountdownMs(ms: number, maxMs: number): boolean {
  return ms > 0 && ms <= maxMs;
}

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function formatClockHm(date: Date): string {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

/** プリセット表示。1時間未満は m:ss */
export function formatDurationCompact(ms: number): string {
  const { h, m, s } = msToHms(ms);
  if (h > 0) {
    return `${h}:${pad2(m)}:${pad2(s)}`;
  }
  return `${m}:${pad2(s)}`;
}

export function clampInt(raw: string, min: number, max: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return min;
  }
  return Math.min(max, Math.max(min, parsed));
}
