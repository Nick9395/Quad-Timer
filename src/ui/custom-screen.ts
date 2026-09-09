import { t } from "../i18n";
import { setSessionActive } from "../store/app-store";

export function renderCustomScreen(parent: HTMLElement): void {
  parent.innerHTML = `
    <section class="screen-body">
      <p class="pomodoro-meta">${t("custom.setTitle")}</p>
      <ul class="setting-list">
        <li><span>${t("custom.afterMinutes", { n: 1, minutes: 5 })}</span><span>--:--</span></li>
        <li><span>${t("custom.afterMinutes", { n: 2, minutes: 20 })}</span><span>--:--</span></li>
      </ul>
      <button type="button" class="btn-add" disabled>${t("custom.add")}</button>
      <p class="hint">${t("custom.hint")}</p>
      <div class="actions actions-3">
        <button type="button" class="btn-primary" data-action="toggle">${t("action.start")}</button>
        <button type="button" class="btn-primary" data-action="mute">${t("action.mute")}</button>
        <button type="button" class="btn-primary" data-action="reset">${t("action.cancel")}</button>
      </div>
    </section>
  `;

  parent.querySelector("[data-action=toggle]")?.addEventListener("click", () => {
    setSessionActive(true);
  });
  parent.querySelector("[data-action=reset]")?.addEventListener("click", () => {
    setSessionActive(false);
  });
}
