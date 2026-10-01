/* NIRMAAN Master App Entry Point */
import { initTheme } from "../core/theme.js";
import { store } from "../core/store.js";
import { Router } from "../core/router.js";
import { renderHeader } from "../components/header.js";
import { renderFooter } from "../components/footer.js";
import { renderBottomNav } from "../components/bottom-nav.js";
import { initScrollReveal } from "../core/observer.js";

class App {
  constructor() {
    this.contentContainer = document.getElementById("app-content");
    this.boot();
  }

  async boot() {
    // 1. Theme Initialization
    initTheme();

    // 2. Initialize Auth Session
    await store.initAuth();

    // 3. Global Layout Rendering
    renderHeader();
    renderFooter();
    renderBottomNav();

    // 4. Global Navbar Scroll Shadows
    window.addEventListener("scroll", () => {
      const nav = document.querySelector("nav");
      if (nav) {
        if (window.scrollY > 20) {
          nav.classList.add("scrolled");
        } else {
          nav.classList.remove("scrolled");
        }
      }
    });

    // 5. Start Router
    this.router = new Router(this.contentContainer);
    this.router.start();

    // 6. Scroll Reveal Observer
    initScrollReveal();

    // 6. Listen for state updates to re-render layout
    store.subscribe("role", () => {
      renderHeader();
      renderBottomNav();
    });

    store.subscribe("lang", () => {
      renderHeader();
      renderBottomNav();
    });
  }
}

// Start App
new App();

// Service Worker Registration for PWA / WebAPK installability
if (
  "serviceWorker" in navigator &&
  (window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") &&
  !window.Capacitor?.isNativePlatform?.()
) {
  window.addEventListener("load", () => {
    try {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        console.warn("ServiceWorker registration skipped or failed:", err);
      });
    } catch (err) {
      console.warn("ServiceWorker init error:", err);
    }
  });
}
