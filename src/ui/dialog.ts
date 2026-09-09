import { t } from "../i18n";

type ConfirmOptions = {
  message: string;
  onYes: () => void;
  onNo: () => void;
};

/**
 * モード切替の確認。YES で走行中セッションを破棄する。
 */
export function openConfirmDialog(options: ConfirmOptions): void {
  const overlay = document.createElement("div");
  overlay.className = "dialog-overlay";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-labelledby", "dialog-message");

  overlay.innerHTML = `
    <div class="dialog-panel">
      <p id="dialog-message" class="dialog-message"></p>
      <div class="dialog-actions">
        <button type="button" class="dialog-btn dialog-btn-no" data-action="no">${t("dialog.no")}</button>
        <button type="button" class="dialog-btn dialog-btn-yes" data-action="yes">${t("dialog.yes")}</button>
      </div>
    </div>
  `;

  const messageEl = overlay.querySelector("#dialog-message");
  if (messageEl) {
    messageEl.textContent = options.message;
  }

  const close = (): void => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      close();
      options.onNo();
    }
  };

  overlay.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const action = target.dataset.action;
    if (action === "yes") {
      close();
      options.onYes();
    }
    if (action === "no") {
      close();
      options.onNo();
    }
  });

  document.addEventListener("keydown", onKey);
  document.body.append(overlay);
  const noBtn = overlay.querySelector<HTMLButtonElement>('[data-action="no"]');
  noBtn?.focus();
}
