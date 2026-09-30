/* NIRMAAN Core Hash Router */
import { store } from "./store.js";
import { t } from "./i18n.js";
import { api } from "../services/api.js";

const routes = [
  { pattern: /^#\/?$/, loader: () => import("../pages/splash.js"), default: true },
  { pattern: /^#\/auth$/, loader: () => import("../pages/auth.js") },
  { pattern: /^#\/onboarding$/, loader: () => import("../pages/onboarding.js") },
  { pattern: /^#\/user-home$/, loader: () => import("../pages/user-home.js") },
  { pattern: /^#\/find$/, loader: () => import("../pages/user-home.js") },
  { pattern: /^#\/search$/, loader: () => import("../pages/user-home.js") },
  { pattern: /^#\/kaarigar\/(.+)$/, loader: () => import("../pages/kaarigar-detail.js") },
  { pattern: /^#\/hire\/(.+)$/, loader: () => import("../pages/hire.js") },
  { pattern: /^#\/track\/(.+)$/, loader: () => import("../pages/track.js") },
  { pattern: /^#\/projects$/, loader: () => import("../pages/projects.js") },
  { pattern: /^#\/user-profile$/, loader: () => import("../pages/user-profile.js") },
  { pattern: /^#\/customer-dashboard$/, loader: () => import("../pages/user-profile.js") },
  { pattern: /^#\/kaarigar-home$/, loader: () => import("../pages/kaarigar-home.js") },
  { pattern: /^#\/worker-dashboard$/, loader: () => import("../pages/kaarigar-home.js") },
  { pattern: /^#\/kaarigar-ai$/, loader: () => import("../pages/kaarigar-ai.js") },
  { pattern: /^#\/voice-assistant$/, loader: () => import("../pages/kaarigar-ai.js") },
  { pattern: /^#\/ai$/, loader: () => import("../pages/kaarigar-ai.js") },
  { pattern: /^#\/kaarigar-profile$/, loader: () => import("../pages/kaarigar-profile.js") },
  { pattern: /^#\/admin$/, loader: () => import("../pages/admin.js") }
];

let currentPage = null;
let navToken = 0;

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
let currentContainer = null;

export class Router {
  constructor(container) {
    this.container = container;
    currentContainer = container;
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  start() {
    this.handleRoute();
  }

  async handleRoute() {
    const hash = window.location.hash || "#/";
    const token = ++navToken;

    let matchedRoute = null;
    let params = [];

    for (const r of routes) {
      const match = hash.match(r.pattern);
      if (match) {
        matchedRoute = r;
        params = match.slice(1);
        break;
      }
    }

    if (!matchedRoute) {
      matchedRoute = routes[0];
    }

    // Call unmount on previous page
    if (currentPage && typeof currentPage.unmount === "function") {
      try {
        currentPage.unmount();
      } catch (e) {
        console.warn("Unmount error:", e);
      }
    }

    this.container.classList.remove("fade-in");
    this.container.classList.add("fade-out");

    try {
      const module = await matchedRoute.loader();
      if (token !== navToken) return; // a newer navigation started; drop this one
      const page = module.default || module;
      currentPage = page;

      const ctx = {
        params,
        store,
        api,
        t
      };

      setTimeout(async () => {
        if (token !== navToken) return;
        this.container.innerHTML = "";
        await page.mount(this.container, ctx);
        this.container.classList.remove("fade-out");
        this.container.classList.add("fade-in");

        // Update active nav links
        document.querySelectorAll("nav a, .bottom-nav a").forEach(link => {
          const href = link.getAttribute("href");
          if (href === hash || (hash === "#/" && href === "#/")) {
            link.classList.add("active");
            link.classList.add("active-nav");
          } else {
            link.classList.remove("active");
            link.classList.remove("active-nav");
          }
        });

        window.scrollTo(0, 0);
      }, 100);

    } catch (err) {
      console.error("Route load error:", err);
      this.container.innerHTML = `
        <div class="container" style="text-align:center; padding: 60px 20px;">
          <h2>Error loading page</h2>
          <p style="color:var(--text-muted); margin: 10px 0 20px;">${escapeHtml(err.message)}</p>
          <a href="#/" class="btn btn-primary">Go to Home</a>
        </div>
      `;
      this.container.classList.remove("fade-out");
      this.container.classList.add("fade-in");
    }
  }
}
