import { t } from "../i18n";
import { hasActiveSession, setSessionActive } from "../store/app-store";

export function renderPomodoroScreen(parent: HTMLElement): void {
  parent.innerHTML = `
    <section class="screen-body">
      <p class="pomodoro-meta">${t("pomodoro.meta", { count: 0, total: "00:00:00" })}</p>
      <ul class="setting-list">
        <li><span>${t("pomodoro.work")}</span><span>25:00</span></li>
        <li><span>${t("pomodoro.shortBreak")}</span><span>05:00</span></li>
        <li><span>${t("pomodoro.longBreak")}</span><span>30:00</span></li>
      </ul>
      <p class="hint">${t("pomodoro.hint")}</p>
      <div class="phase-box">${t("pomodoro.phaseWork", { minutes: 25 })}</div>
      <div class="actions">
        <button type="button" class="btn-primary" data-action="toggle">${t("action.startStop")}</button>
        <button type="button" class="btn-primary" data-action="reset">${t("action.reset")}</button>
      </div>
    </section>
  `;

  parent.querySelector("[data-action=toggle]")?.addEventListener("click", () => {
    setSessionActive(!hasActiveSession());
  });
  parent.querySelector("[data-action=reset]")?.addEventListener("click", () => {
    setSessionActive(false);
  });
}
