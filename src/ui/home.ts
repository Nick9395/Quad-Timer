import { t } from "../i18n";
import { openMode } from "../app-nav";
import { mountClock } from "./clock";

export function renderHome(root: HTMLElement): () => void {
  root.innerHTML = `
    <div class="phone">
      <header class="home-header">
        <h1 class="brand">Quad Timer</h1>
        <p class="now-clock" data-clock></p>
        <p class="lead">${t("home.lead1")}<br />${t("home.lead2")}</p>
      </header>
      <div class="home-grid">
        <button type="button" class="mode-card" data-mode="kitchen">${t("mode.kitchen")}</button>
        <button type="button" class="mode-card" data-mode="stopwatch">${t("mode.stopwatch")}</button>
        <button type="button" class="mode-card" data-mode="pomodoro">${t("mode.pomodoro")}</button>
        <button type="button" class="mode-card" data-mode="custom">${t("mode.custom")}</button>
      </div>
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>("[data-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (
        mode === "kitchen" ||
        mode === "stopwatch" ||
        mode === "pomodoro" ||
        mode === "custom"
      ) {
        openMode(mode);
      }
    });
  });

  const clockEl = root.querySelector<HTMLElement>("[data-clock]");
  return clockEl ? mountClock(clockEl) : () => undefined;
}
