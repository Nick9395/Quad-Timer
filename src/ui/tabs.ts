import { t, type MessageKey } from "../i18n";
import { TIMER_MODES, type TimerMode } from "../store/app-store";
import { requestModeChange } from "../app-nav";

const TAB_KEYS: Record<TimerMode, MessageKey> = {
  kitchen: "tab.kitchen",
  stopwatch: "tab.stopwatch",
  pomodoro: "tab.pomodoro",
  custom: "tab.custom",
};

export function renderTabs(parent: HTMLElement, active: TimerMode): void {
  const nav = document.createElement("nav");
  nav.className = "tab-bar";
  nav.setAttribute("aria-label", t("tabs.aria"));

  TIMER_MODES.forEach((mode) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-bar__item${mode === active ? " is-active" : ""}`;
    button.textContent = t(TAB_KEYS[mode]);
    button.addEventListener("click", () => {
      void requestModeChange(mode);
    });
    nav.append(button);
  });

  parent.append(nav);
}
