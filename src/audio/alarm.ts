export type AlarmSoundId = "beep" | "bell" | "double";

export const ALARM_SOUNDS: AlarmSoundId[] = ["beep", "bell", "double"];

const STORAGE_KEY = "quad-timer.alarm.v2";
const LEGACY_SOUND_KEY = "quad-timer.sound.v1";
const DEFAULT_VOLUME = 0.7;
const PEAK_GAIN = 0.12;

type AlarmPrefs = {
  sound: AlarmSoundId;
  volume: number;
};

let audio: AudioContext | null = null;
let loopId: number | null = null;
let prefs: AlarmPrefs = loadPrefs();

function isSoundId(value: string): value is AlarmSoundId {
  return value === "beep" || value === "bell" || value === "double";
}

function clampVolume(value: number): number {
  if (Number.isNaN(value)) {
    return DEFAULT_VOLUME;
  }
  return Math.min(1, Math.max(0, value));
}

function loadPrefs(): AlarmPrefs {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AlarmPrefs>;
      return {
        sound: parsed.sound && isSoundId(parsed.sound) ? parsed.sound : "beep",
        volume: clampVolume(Number(parsed.volume)),
      };
    }
    const legacy = window.localStorage.getItem(LEGACY_SOUND_KEY);
    if (legacy && isSoundId(legacy)) {
      return { sound: legacy, volume: DEFAULT_VOLUME };
    }
  } catch {
    // 読み取り失敗時は既定
  }
  return { sound: "beep", volume: DEFAULT_VOLUME };
}

function persist(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // 保存失敗でも再生は続ける
  }
}

export function getAlarmSound(): AlarmSoundId {
  return prefs.sound;
}

export function setAlarmSound(id: AlarmSoundId): void {
  prefs = { ...prefs, sound: id };
  persist();
}

export function getAlarmVolume(): number {
  return prefs.volume;
}

export function setAlarmVolume(volume: number): void {
  prefs = { ...prefs, volume: clampVolume(volume) };
  persist();
}

export function unlockAudio(): void {
  audio ??= new AudioContext();
  void audio.resume();
}

function tone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  at: number,
  type: OscillatorType = "sine",
): void {
  const peak = PEAK_GAIN * prefs.volume;
  if (peak <= 0) {
    return;
  }
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(peak, at);
  gain.gain.exponentialRampToValueAtTime(0.001, at + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(at);
  osc.stop(at + duration);
}

function playPattern(ctx: AudioContext, sound: AlarmSoundId): void {
  if (prefs.volume <= 0) {
    return;
  }
  const at = ctx.currentTime;
  if (sound === "beep") {
    tone(ctx, 880, 0.18, at);
    return;
  }
  if (sound === "bell") {
    tone(ctx, 523.25, 0.45, at, "triangle");
    tone(ctx, 784.0, 0.5, at + 0.04, "triangle");
    return;
  }
  tone(ctx, 880, 0.12, at);
  tone(ctx, 988, 0.14, at + 0.2);
}

export function previewAlarm(sound: AlarmSoundId = prefs.sound): void {
  unlockAudio();
  if (audio) {
    playPattern(audio, sound);
  }
}

export function startAlarm(): void {
  unlockAudio();
  if (loopId !== null || !audio) {
    return;
  }
  const sound = prefs.sound;
  const ctx = audio;
  playPattern(ctx, sound);
  const interval = sound === "bell" ? 1100 : 750;
  loopId = window.setInterval(() => {
    playPattern(ctx, sound);
  }, interval);
}

export function stopAlarm(): void {
  if (loopId !== null) {
    window.clearInterval(loopId);
    loopId = null;
  }
}
