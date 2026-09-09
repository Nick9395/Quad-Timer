import { getScreen, subscribe } from "./store/app-store";
import { renderHome } from "./ui/home";
import { renderTimerShell } from "./ui/timer-shell";

export function mountApp(root: HTMLElement): void {
  let stopClock: (() => void) | undefined;

  const render = (): void => {
    stopClock?.();
    const screen = getScreen();
    if (screen === "home") {
      stopClock = renderHome(root);
      return;
    }
    stopClock = renderTimerShell(root, screen);
  };

  subscribe(render);
  render();
}
