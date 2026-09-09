import { applyDocumentLocale } from "./i18n";
import { mountApp } from "./app";
import { initKitchenStore } from "./store/kitchen-store";
import "./styles/tokens.css";
import "./styles/layout.css";

applyDocumentLocale();
initKitchenStore();

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) {
  throw new Error("#app が見つかりません");
}

mountApp(root);
