export type Screen = "home" | "kitchen" | "stopwatch" | "pomodoro" | "custom";
export type TimerMode = Exclude<Screen, "home">;

export const TIMER_MODES: TimerMode[] = [
  "kitchen",
  "stopwatch",
  "pomodoro",
  "custom",
];

type Listener = () => void;

let currentScreen: Screen = "home";
/** いずれかのタイマーが走行中か（本実装は各ドメインから更新する） */
let sessionActive = false;
const listeners = new Set<Listener>();
const sessionResetters: Array<() => void> = [];

function notify(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function getScreen(): Screen {
  return currentScreen;
}

export function setScreen(screen: Screen): void {
  if (currentScreen === screen) {
    return;
  }
  currentScreen = screen;
  notify();
}

export function hasActiveSession(): boolean {
  return sessionActive;
}

export function setSessionActive(active: boolean): void {
  sessionActive = active;
}

/** モード切替 YES 時。各モードの走行状態をここで捨てる */
export function registerSessionReset(reset: () => void): void {
  sessionResetters.push(reset);
}

export function clearSession(): void {
  for (const reset of sessionResetters) {
    reset();
  }
  sessionActive = false;
  notify();
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
