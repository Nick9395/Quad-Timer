import { t } from "../i18n";
import { setSessionActive } from "../store/app-store";

export function renderStopwatchScreen(parent: HTMLElement): void {
  parent.innerHTML = `
    <section class="screen-body">
      <p class="time-main">00:00:00</p>
      <ul class="lap-list">
        <li>${t("stopwatch.lap", { n: 1, time: "00:00:00" })}</li>
      </ul>
      <div class="actions actions-3">
        <button type="button" class="btn-primary" data-action="toggle">${t("action.startLap")}</button>
        <button type="button" class="btn-primary" data-action="stop">${t("action.stop")}</button>
        <button type="button" class="btn-primary" data-action="reset">${t("action.reset")}</button>
      </div>
    </section>
  `;

  parent.querySelector("[data-action=toggle]")?.addEventListener("click", () => {
    setSessionActive(true);
  });
  parent.querySelector("[data-action=stop]")?.addEventListener("click", () => {
    setSessionActive(false);
  });
  parent.querySelector("[data-action=reset]")?.addEventListener("click", () => {
    setSessionActive(false);
  });
}
