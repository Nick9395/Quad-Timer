import { t } from "../i18n";
import type { TimerMode } from "../store/app-store";
import { goHome } from "../app-nav";
import { mountClock } from "./clock";
import { renderCustomScreen } from "./custom-screen";
import { renderKitchenScreen } from "./kitchen-screen";
import { renderPomodoroScreen } from "./pomodoro-screen";
import { renderStopwatchScreen } from "./stopwatch-screen";
import { renderTabs } from "./tabs";

export function renderTimerShell(
  root: HTMLElement,
  mode: TimerMode,
): () => void {
  root.innerHTML = `
    <div class="phone">
      <div data-tabs></div>
      <p class="now-clock now-clock--bar" data-clock></p>
      <div data-body></div>
      <button type="button" class="home-link" data-home>${t("nav.home")}</button>
    </div>
  `;

  const tabsHost = root.querySelector<HTMLElement>("[data-tabs]");
  const body = root.querySelector<HTMLElement>("[data-body]");
  let stopScreen: (() => void) | undefined;
  if (tabsHost) {
    renderTabs(tabsHost, mode);
  }
  if (body) {
    switch (mode) {
      case "kitchen":
        stopScreen = renderKitchenScreen(body);
        break;
      case "stopwatch":
        renderStopwatchScreen(body);
        break;
      case "pomodoro":
        renderPomodoroScreen(body);
        break;
      case "custom":
        renderCustomScreen(body);
        break;
    }
  }

  root.querySelector("[data-home]")?.addEventListener("click", () => {
    goHome();
  });

  const clockEl = root.querySelector<HTMLElement>("[data-clock]");
  const stopClock = clockEl ? mountClock(clockEl) : () => undefined;
  return () => {
    stopClock();
    stopScreen?.();
  };
}
