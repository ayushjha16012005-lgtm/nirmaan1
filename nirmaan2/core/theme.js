/* NIRMAAN Theme Manager */
import { store } from "./store.js";

export function initTheme() {
  const currentTheme = store.get("theme") || "light";
  applyTheme(currentTheme);

  store.subscribe("theme", (theme) => {
    applyTheme(theme);
  });
}

export function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-theme");
    document.body.classList.remove("light-theme");
  } else {
    document.body.classList.add("light-theme");
    document.body.classList.remove("dark-theme");
  }
}

export function toggleTheme() {
  const current = store.get("theme");
  const next = current === "dark" ? "light" : "dark";
  store.set("theme", next);
  return next;
}
