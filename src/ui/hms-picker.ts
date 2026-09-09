import type { KitchenDraft } from "../store/kitchen-store";

const ITEM_H = 32;
const VISIBLE = 3;
const PAD = Math.floor(VISIBLE / 2);

function range(maxInclusive: number): number[] {
  return Array.from({ length: maxInclusive + 1 }, (_, i) => i);
}

function padItems(values: number[]): string {
  const pads = Array.from({ length: PAD }, () => `<div class="wheel-pad"></div>`).join("");
  const items = values
    .map((value) => `<div class="wheel-item" data-value="${value}">${value}</div>`)
    .join("");
  return `${pads}${items}${pads}`;
}

function selectedIndex(scroller: HTMLElement): number {
  return Math.round(scroller.scrollTop / ITEM_H);
}

function scrollToValue(scroller: HTMLElement, value: number): void {
  const top = value * ITEM_H;
  if (Math.abs(scroller.scrollTop - top) < 2) {
    return;
  }
  scroller.scrollTop = top;
}

/**
 * iPhone のタイマーに近い、スクロール選択。キーボードは出さない。
 */
export function mountHmsPicker(
  host: HTMLElement,
  options: {
    hoursLabel: string;
    minutesLabel: string;
    secondsLabel: string;
    getValue: () => KitchenDraft;
    onChange: (next: KitchenDraft) => void;
  },
): { syncFromStore: () => void; destroy: () => void } {
  host.innerHTML = `
    <div class="hms-picker" role="group">
      <div class="wheel-highlight" aria-hidden="true"></div>
      <div class="wheel-col">
        <div class="wheel" data-wheel="h" tabindex="0">${padItems(range(24))}</div>
        <span class="wheel-unit">${options.hoursLabel}</span>
      </div>
      <div class="wheel-col">
        <div class="wheel" data-wheel="m" tabindex="0">${padItems(range(59))}</div>
        <span class="wheel-unit">${options.minutesLabel}</span>
      </div>
      <div class="wheel-col">
        <div class="wheel" data-wheel="s" tabindex="0">${padItems(range(59))}</div>
        <span class="wheel-unit">${options.secondsLabel}</span>
      </div>
    </div>
  `;

  const wheelH = host.querySelector<HTMLElement>('[data-wheel="h"]');
  const wheelM = host.querySelector<HTMLElement>('[data-wheel="m"]');
  const wheelS = host.querySelector<HTMLElement>('[data-wheel="s"]');
  if (!wheelH || !wheelM || !wheelS) {
    return { syncFromStore: () => undefined, destroy: () => undefined };
  }

  const wheels = { h: wheelH, m: wheelM, s: wheelS };
  const scrollTimers = new Map<HTMLElement, number>();
  let userScrolling = false;

  const read = (): KitchenDraft => {
    let h = selectedIndex(wheelH);
    let m = selectedIndex(wheelM);
    let s = selectedIndex(wheelS);
    h = Math.min(24, Math.max(0, h));
    m = Math.min(59, Math.max(0, m));
    s = Math.min(59, Math.max(0, s));
    if (h === 24) {
      m = 0;
      s = 0;
    }
    return { h, m, s };
  };

  const emit = (): void => {
    const next = read();
    if (next.h === 24 && (selectedIndex(wheelM) !== 0 || selectedIndex(wheelS) !== 0)) {
      scrollToValue(wheelM, 0);
      scrollToValue(wheelS, 0);
    }
    options.onChange(next);
  };

  const settle = (scroller: HTMLElement): void => {
    const value = selectedIndex(scroller);
    scrollToValue(scroller, value);
    userScrolling = false;
    emit();
  };

  const onScroll = (scroller: HTMLElement): void => {
    userScrolling = true;
    const prev = scrollTimers.get(scroller);
    if (prev !== undefined) {
      window.clearTimeout(prev);
    }
    scrollTimers.set(
      scroller,
      window.setTimeout(() => {
        settle(scroller);
      }, 140),
    );
  };

  const onScrollEnd = (scroller: HTMLElement): void => {
    const prev = scrollTimers.get(scroller);
    if (prev !== undefined) {
      window.clearTimeout(prev);
    }
    settle(scroller);
  };

  const onKey = (event: KeyboardEvent, key: "h" | "m" | "s"): void => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }
    event.preventDefault();
    const max = key === "h" ? 24 : 59;
    const current = selectedIndex(wheels[key]);
    const next = event.key === "ArrowUp" ? current - 1 : current + 1;
    const clamped = Math.min(max, Math.max(0, next));
    scrollToValue(wheels[key], clamped);
    emit();
  };

  const syncFromStore = (): void => {
    if (userScrolling) {
      return;
    }
    const value = options.getValue();
    scrollToValue(wheelH, value.h);
    scrollToValue(wheelM, value.h === 24 ? 0 : value.m);
    scrollToValue(wheelS, value.h === 24 ? 0 : value.s);
  };

  wheelH.addEventListener("scroll", () => onScroll(wheelH), { passive: true });
  wheelM.addEventListener("scroll", () => onScroll(wheelM), { passive: true });
  wheelS.addEventListener("scroll", () => onScroll(wheelS), { passive: true });
  wheelH.addEventListener("scrollend", () => onScrollEnd(wheelH));
  wheelM.addEventListener("scrollend", () => onScrollEnd(wheelM));
  wheelS.addEventListener("scrollend", () => onScrollEnd(wheelS));
  wheelH.addEventListener("keydown", (event) => onKey(event, "h"));
  wheelM.addEventListener("keydown", (event) => onKey(event, "m"));
  wheelS.addEventListener("keydown", (event) => onKey(event, "s"));

  requestAnimationFrame(syncFromStore);

  return {
    syncFromStore,
    destroy: () => {
      for (const id of scrollTimers.values()) {
        window.clearTimeout(id);
      }
    },
  };
}
