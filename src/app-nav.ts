import type { Screen, TimerMode } from "./store/app-store";
import {
  clearSession,
  getScreen,
  hasActiveSession,
  setScreen,
} from "./store/app-store";
import { t } from "./i18n";
import { openConfirmDialog } from "./ui/dialog";
import { getKitchenTimers } from "./store/kitchen-store";

export function goHome(): void {
  void requestModeChange("home");
}

export function openMode(mode: TimerMode): void {
  if (
    hasActiveSession() &&
    getScreen() === "home" &&
    mode === "kitchen" &&
    getKitchenTimers().length > 0
  ) {
    setScreen(mode);
    return;
  }
  if (hasActiveSession() && getScreen() === "home") {
    void requestModeChange(mode);
    return;
  }
  setScreen(mode);
}

export function requestModeChange(next: Screen): void {
  const current = getScreen();
  if (next === current) {
    return;
  }

  const resumeKitchen =
    current === "home" && next === "kitchen" && getKitchenTimers().length > 0;
  if (hasActiveSession() && !resumeKitchen) {
    openConfirmDialog({
      message: t("nav.switchConfirm"),
      onYes: () => {
        clearSession();
        setScreen(next);
      },
      onNo: () => undefined,
    });
    return;
  }

  setScreen(next);
}
