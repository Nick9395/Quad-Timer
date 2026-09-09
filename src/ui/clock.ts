import { getLocale } from "../i18n";

const WEEKDAYS_JA = ["日", "月", "火", "水", "木", "金", "土"] as const;
const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/** 例: 2026/8/26(水) 19:30 / 2026/8/26 (Wed) 19:30 */
export function formatNowLabel(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const hh = pad2(date.getHours());
  const mm = pad2(date.getMinutes());
  if (getLocale() === "ja") {
    const w = WEEKDAYS_JA[date.getDay()];
    return `${y}/${m}/${d}(${w}) ${hh}:${mm}`;
  }
  const w = WEEKDAYS_EN[date.getDay()];
  return `${y}/${m}/${d} (${w}) ${hh}:${mm}`;
}

export function mountClock(el: HTMLElement): () => void {
  const tick = (): void => {
    el.textContent = formatNowLabel();
  };
  tick();
  const id = window.setInterval(tick, 1000);
  return () => {
    window.clearInterval(id);
  };
}
