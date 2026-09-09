import { startAlarm, stopAlarm, unlockAudio } from "../audio/alarm";
import {
  canAddKitchenTimer,
  createKitchenTimer,
  isKitchenRinging,
  pauseKitchenTimerAt,
  rememberPreset,
  resumeKitchenTimerAt,
  validateKitchenDuration,
  type KitchenTimer,
} from "../domain/kitchen";
import { hmsToMs } from "../domain/clock";
import { loadJson, saveJson } from "../persist/storage";
import { registerSessionReset, setSessionActive } from "./app-store";

const STORAGE_KEY = "quad-timer.kitchen.v1";
const TICK_MS = 250;

export type KitchenDraft = { h: number; m: number; s: number };

type PersistedKitchen = {
  timers: KitchenTimer[];
  presets: number[];
  silenced: string[];
  draft: KitchenDraft;
};

type KitchenListener = (event: "tick" | "change") => void;

let timers: KitchenTimer[] = [];
let presets: number[] = [];
let silenced = new Set<string>();
let draft: KitchenDraft = { h: 0, m: 0, s: 0 };
let tickId: number | null = null;
const listeners = new Set<KitchenListener>();

function persist(): void {
  saveJson(STORAGE_KEY, {
    timers,
    presets,
    silenced: [...silenced],
    draft,
  } satisfies PersistedKitchen);
}

function notify(event: "tick" | "change"): void {
  for (const listener of listeners) {
    listener(event);
  }
}

function syncSession(): void {
  setSessionActive(timers.length > 0);
}

function dueUnsilenced(now: number): KitchenTimer[] {
  return timers.filter(
    (timer) => isKitchenRinging(timer, now) && !silenced.has(timer.id),
  );
}

function syncAlarm(now: number): void {
  if (dueUnsilenced(now).length > 0) {
    startAlarm();
    return;
  }
  stopAlarm();
}

function tick(): void {
  const now = Date.now();
  syncAlarm(now);
  notify("tick");
}

function ensureTick(): void {
  if (timers.length === 0) {
    if (tickId !== null) {
      window.clearInterval(tickId);
      tickId = null;
    }
    stopAlarm();
    return;
  }
  if (tickId === null) {
    tickId = window.setInterval(tick, TICK_MS);
  }
}

function resetKitchen(): void {
  timers = [];
  silenced = new Set();
  stopAlarm();
  if (tickId !== null) {
    window.clearInterval(tickId);
    tickId = null;
  }
  persist();
  notify("change");
}

function restore(): void {
  const saved = loadJson<PersistedKitchen>(STORAGE_KEY);
  if (!saved) {
    return;
  }
  timers = Array.isArray(saved.timers)
    ? saved.timers.map((timer) => ({
        ...timer,
        pausedRemainingMs: timer.pausedRemainingMs ?? null,
      }))
    : [];
  presets = Array.isArray(saved.presets) ? saved.presets : [];
  silenced = new Set(saved.silenced ?? []);
  if (saved.draft) {
    draft = saved.draft;
  }
}

export function initKitchenStore(): void {
  restore();
  registerSessionReset(resetKitchen);
  ensureTick();
  syncAlarm(Date.now());
  syncSession();
}

export function subscribeKitchen(listener: KitchenListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getKitchenTimers(): readonly KitchenTimer[] {
  return timers;
}

export function getKitchenPresets(): readonly number[] {
  return presets;
}

export function getKitchenDraft(): KitchenDraft {
  return draft;
}

export function setKitchenDraft(next: KitchenDraft): void {
  draft = next;
  persist();
}

export function startKitchenTimer(
  now = Date.now(),
): "ok" | "empty" | "invalid" | "full" {
  unlockAudio();
  if (!canAddKitchenTimer(timers.length)) {
    return "full";
  }
  const durationMs = hmsToMs(draft.h, draft.m, draft.s);
  const error = validateKitchenDuration(durationMs);
  if (error) {
    return error;
  }
  const id = crypto.randomUUID();
  timers = [...timers, createKitchenTimer(durationMs, now, id)];
  presets = rememberPreset(presets, durationMs);
  persist();
  ensureTick();
  syncSession();
  notify("change");
  return "ok";
}

export function applyKitchenPreset(durationMs: number): void {
  const totalSec = Math.floor(durationMs / 1000);
  draft = {
    h: Math.floor(totalSec / 3600),
    m: Math.floor(totalSec / 60) % 60,
    s: totalSec % 60,
  };
  persist();
  notify("change");
}

export function removeKitchenTimer(id: string): void {
  timers = timers.filter((timer) => timer.id !== id);
  silenced.delete(id);
  persist();
  ensureTick();
  syncAlarm(Date.now());
  syncSession();
  notify("change");
}

export function pauseKitchenTimer(id: string, now = Date.now()): void {
  timers = timers.map((timer) =>
    timer.id === id ? pauseKitchenTimerAt(timer, now) : timer,
  );
  persist();
  notify("change");
}

export function resumeKitchenTimer(id: string, now = Date.now()): void {
  timers = timers.map((timer) =>
    timer.id === id ? resumeKitchenTimerAt(timer, now) : timer,
  );
  persist();
  ensureTick();
  notify("change");
}

/** 鳴っている1本の音を止め、そのタイマーを閉じる */
export function stopKitchenRing(id: string): void {
  silenced.add(id);
  timers = timers.filter((timer) => timer.id !== id);
  silenced.delete(id);
  persist();
  ensureTick();
  syncAlarm(Date.now());
  syncSession();
  notify("change");
}

export function cancelAllKitchenTimers(): void {
  resetKitchen();
  syncSession();
}
