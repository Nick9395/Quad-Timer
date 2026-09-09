import { t } from "../i18n";
import {
  formatClockHm,
  formatDurationCompact,
  msToHms,
} from "../domain/clock";
import {
  isKitchenPaused,
  isKitchenRinging,
  kitchenRemainingMs,
  soonestKitchenTimer,
  type KitchenTimer,
} from "../domain/kitchen";
import {
  ALARM_SOUNDS,
  getAlarmSound,
  getAlarmVolume,
  previewAlarm,
  setAlarmSound,
  setAlarmVolume,
  type AlarmSoundId,
} from "../audio/alarm";
import {
  applyKitchenPreset,
  cancelAllKitchenTimers,
  getKitchenDraft,
  getKitchenPresets,
  getKitchenTimers,
  pauseKitchenTimer,
  resumeKitchenTimer,
  setKitchenDraft,
  startKitchenTimer,
  stopKitchenRing,
  subscribeKitchen,
} from "../store/kitchen-store";
import { mountHmsPicker } from "./hms-picker";

function remainingLabelFromMs(ms: number): string {
  const { h, m, s } = msToHms(ms);
  return t("kitchen.remaining", { h, m, s });
}

function soundLabel(id: AlarmSoundId): string {
  if (id === "bell") {
    return t("kitchen.soundBell");
  }
  if (id === "double") {
    return t("kitchen.soundDouble");
  }
  return t("kitchen.soundBeep");
}

function rowView(timer: KitchenTimer, now: number) {
  const ringing = isKitchenRinging(timer, now);
  const paused = isKitchenPaused(timer);
  const label = ringing
    ? t("kitchen.ringing")
    : remainingLabelFromMs(kitchenRemainingMs(timer, now));
  let action = "pause";
  let actionLabel = t("kitchen.pause");
  if (ringing) {
    action = "stop";
    actionLabel = t("kitchen.stop");
  } else if (paused) {
    action = "resume";
    actionLabel = t("kitchen.resume");
  }
  const stateClass = ringing ? "is-ringing" : paused ? "is-paused" : "";
  return { label, action, actionLabel, stateClass };
}

export function renderKitchenScreen(parent: HTMLElement): () => void {
  parent.innerHTML = `
    <section class="screen-body">
      <div class="kitchen-head">
        <p class="time-sub" data-sub hidden></p>
        <div class="sound-wrap">
          <button type="button" class="sound-btn" data-sound-toggle aria-expanded="false" aria-label="${t("kitchen.soundAria")}">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
              <path fill="currentColor" d="M4 9v6h4l5 4V5L8 9H4zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zm-2.5-8.5v2.07A7.5 7.5 0 0 1 21 12a7.5 7.5 0 0 1-6 7.43V21.5A9.5 9.5 0 0 0 23 12a9.5 9.5 0 0 0-8-8.5z"/>
            </svg>
          </button>
          <div class="sound-menu" data-sound-menu hidden>
            <div data-sound-options role="listbox" aria-label="${t("kitchen.soundAria")}"></div>
            <label class="volume-row">
              <span>${t("kitchen.volume")}</span>
              <input type="range" min="0" max="100" step="1" data-volume aria-label="${t("kitchen.volume")}" />
            </label>
          </div>
        </div>
      </div>
      <ul class="timer-list" data-list aria-label="${t("kitchen.listAria")}"></ul>
      <div class="kitchen-picker">
        <div data-picker></div>
      </div>
      <p class="hint" data-hint hidden></p>
      <div class="kitchen-history">
        <p class="history-title">${t("kitchen.history")}</p>
        <div class="preset-row" data-presets role="group" aria-label="${t("kitchen.presetsAria")}"></div>
      </div>
      <div class="actions">
        <button type="button" class="btn-primary" data-action="start">${t("action.start")}</button>
        <button type="button" class="btn-primary" data-action="cancel">${t("action.cancel")}</button>
      </div>
    </section>
  `;

  const subEl = parent.querySelector<HTMLElement>("[data-sub]");
  const hintEl = parent.querySelector<HTMLElement>("[data-hint]");
  const listEl = parent.querySelector("[data-list]");
  const presetsEl = parent.querySelector("[data-presets]");
  const pickerHost = parent.querySelector<HTMLElement>("[data-picker]");
  const soundToggle = parent.querySelector<HTMLButtonElement>("[data-sound-toggle]");
  const soundMenu = parent.querySelector<HTMLElement>("[data-sound-menu]");
  const soundOptions = parent.querySelector<HTMLElement>("[data-sound-options]");
  const volumeInput = parent.querySelector<HTMLInputElement>("[data-volume]");

  let startError: "empty" | "invalid" | "full" | null = null;
  let volumePreviewTimer = 0;

  const picker = pickerHost
    ? mountHmsPicker(pickerHost, {
        hoursLabel: t("kitchen.hours"),
        minutesLabel: t("kitchen.minutes"),
        secondsLabel: t("kitchen.seconds"),
        getValue: getKitchenDraft,
        onChange: (next) => {
          setKitchenDraft(next);
        },
      })
    : undefined;

  const paintSoundMenu = (): void => {
    if (!soundOptions) {
      return;
    }
    const selected = getAlarmSound();
    soundOptions.innerHTML = ALARM_SOUNDS.map(
      (id) =>
        `<button type="button" role="option" class="sound-option${id === selected ? " is-selected" : ""}" data-sound="${id}">${soundLabel(id)}</button>`,
    ).join("");
  };

  const syncVolumeInput = (): void => {
    if (volumeInput) {
      volumeInput.value = String(Math.round(getAlarmVolume() * 100));
    }
  };

  const paintSub = (now: number): void => {
    if (!subEl) {
      return;
    }
    const soonest = soonestKitchenTimer(getKitchenTimers(), now);
    if (soonest) {
      const text = t("kitchen.notifyAt", {
        time: formatClockHm(new Date(soonest.endAt)),
      });
      subEl.hidden = false;
      if (subEl.textContent !== text) {
        subEl.textContent = text;
      }
      return;
    }
    subEl.hidden = true;
    subEl.textContent = "";
  };

  const paintHint = (): void => {
    if (!hintEl) {
      return;
    }
    if (startError === "empty") {
      hintEl.hidden = false;
      hintEl.textContent = t("kitchen.errorEmpty");
    } else if (startError === "invalid") {
      hintEl.hidden = false;
      hintEl.textContent = t("kitchen.errorInvalid");
    } else if (startError === "full") {
      hintEl.hidden = false;
      hintEl.textContent = t("kitchen.errorFull");
    } else {
      hintEl.hidden = true;
      hintEl.textContent = "";
    }
  };

  const paintPresets = (): void => {
    if (!presetsEl) {
      return;
    }
    const presets = getKitchenPresets();
    presetsEl.innerHTML =
      presets.length === 0
        ? ""
        : presets
            .map(
              (ms) =>
                `<button type="button" class="preset-chip" data-preset="${ms}">${formatDurationCompact(ms)}</button>`,
            )
            .join("");
  };

  const rebuildList = (now: number): void => {
    if (!listEl) {
      return;
    }
    listEl.innerHTML = getKitchenTimers()
      .map((timer) => {
        const view = rowView(timer, now);
        return `<li data-timer-id="${timer.id}" class="${view.stateClass}">
            <span data-remain>${view.label}</span>
            <button type="button" class="row-action" data-action-row="${view.action}" data-id="${timer.id}">${view.actionLabel}</button>
          </li>`;
      })
      .join("");
  };

  const patchList = (now: number): void => {
    if (!listEl) {
      return;
    }
    const timers = getKitchenTimers();
    const rows = [...listEl.querySelectorAll<HTMLElement>("li[data-timer-id]")];
    const same =
      rows.length === timers.length &&
      rows.every((row, index) => row.dataset.timerId === timers[index]?.id);
    if (!same) {
      rebuildList(now);
      return;
    }
    timers.forEach((timer, index) => {
      const row = rows[index];
      const view = rowView(timer, now);
      const remain = row.querySelector("[data-remain]");
      const button = row.querySelector<HTMLButtonElement>("[data-action-row]");
      if (remain && remain.textContent !== view.label) {
        remain.textContent = view.label;
      }
      if (row.className !== view.stateClass) {
        row.className = view.stateClass;
      }
      if (button) {
        if (button.dataset.actionRow !== view.action) {
          button.dataset.actionRow = view.action;
        }
        if (button.textContent !== view.actionLabel) {
          button.textContent = view.actionLabel;
        }
      }
    });
  };

  const paintTick = (): void => {
    const now = Date.now();
    paintSub(now);
    patchList(now);
  };

  const paintChange = (): void => {
    const now = Date.now();
    paintSub(now);
    paintHint();
    paintPresets();
    rebuildList(now);
    picker?.syncFromStore();
  };

  parent.querySelector("[data-action=start]")?.addEventListener("click", () => {
    startError = null;
    const result = startKitchenTimer();
    if (result !== "ok") {
      startError = result;
      paintHint();
    }
  });
  parent.querySelector("[data-action=cancel]")?.addEventListener("click", () => {
    startError = null;
    cancelAllKitchenTimers();
  });

  soundToggle?.addEventListener("click", (event) => {
    event.stopPropagation();
    const open = soundMenu?.hidden ?? true;
    if (soundMenu) {
      soundMenu.hidden = !open;
    }
    soundToggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) {
      paintSoundMenu();
      syncVolumeInput();
    }
  });

  soundMenu?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.sound) {
      return;
    }
    const id = target.dataset.sound;
    if (id !== "beep" && id !== "bell" && id !== "double") {
      return;
    }
    setAlarmSound(id);
    previewAlarm(id);
    paintSoundMenu();
  });

  volumeInput?.addEventListener("input", () => {
    setAlarmVolume(Number(volumeInput.value) / 100);
    window.clearTimeout(volumePreviewTimer);
    volumePreviewTimer = window.setTimeout(() => {
      previewAlarm();
    }, 80);
  });

  volumeInput?.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  const onDocClick = (event: MouseEvent): void => {
    if (!(event.target instanceof Node) || parent.contains(event.target)) {
      return;
    }
    if (soundMenu) {
      soundMenu.hidden = true;
    }
    soundToggle?.setAttribute("aria-expanded", "false");
  };
  document.addEventListener("click", onDocClick);

  presetsEl?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || target.dataset.preset === undefined) {
      return;
    }
    applyKitchenPreset(Number(target.dataset.preset));
  });

  listEl?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement) || !target.dataset.id) {
      return;
    }
    const id = target.dataset.id;
    const action = target.dataset.actionRow;
    if (action === "pause") {
      pauseKitchenTimer(id);
    } else if (action === "resume") {
      resumeKitchenTimer(id);
    } else if (action === "stop") {
      stopKitchenRing(id);
    }
  });

  paintSoundMenu();
  syncVolumeInput();
  const stop = subscribeKitchen((event) => {
    if (event === "tick") {
      paintTick();
      return;
    }
    paintChange();
  });
  paintChange();
  return () => {
    stop();
    picker?.destroy();
    window.clearTimeout(volumePreviewTimer);
    document.removeEventListener("click", onDocClick);
  };
}
