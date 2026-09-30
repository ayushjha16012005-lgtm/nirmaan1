/* NIRMAAN Core Hash Router */
import { store } from "./store.js";
import { t } from "./i18n.js";

const unavailable = () => import("../pages/unavailable.js");

const routes = [
  { pattern: /^#\/?$/, loader: () => import("../pages/splash.js"), default: true },
  { pattern: /^#\/auth$/, loader: () => import("../pages/auth.js") },
  { pattern: /^#\/onboarding$/, loader: () => import("../pages/onboarding.js") },
  { pattern: /^#\/user-home$/, loader: unavailable, feature: "Find Kaarigars" },
  { pattern: /^#\/find$/, loader: unavailable, feature: "Find Kaarigars" },
  { pattern: /^#\/search$/, loader: unavailable, feature: "Find Kaarigars" },
  { pattern: /^#\/kaarigar\/(.+)$/, loader: unavailable, feature: "Kaarigar Details" },
  { pattern: /^#\/hire\/(.+)$/, loader: unavailable, feature: "Hire a Kaarigar" },
  { pattern: /^#\/track\/(.+)$/, loader: unavailable, feature: "Live Tracking & Payments" },
  { pattern: /^#\/projects$/, loader: unavailable, feature: "Projects" },
  { pattern: /^#\/user-profile$/, loader: unavailable, feature: "Customer Dashboard" },
  { pattern: /^#\/customer-dashboard$/, loader: unavailable, feature: "Customer Dashboard" },
  { pattern: /^#\/kaarigar-home$/, loader: unavailable, feature: "Worker Dashboard" },
  { pattern: /^#\/worker-dashboard$/, loader: unavailable, feature: "Worker Dashboard" },
  { pattern: /^#\/kaarigar-ai$/, loader: unavailable, feature: "AI Voice Assistant" },
  { pattern: /^#\/voice-assistant$/, loader: unavailable, feature: "AI Voice Assistant" },
  { pattern: /^#\/ai$/, loader: unavailable, feature: "AI Voice Assistant" },
  { pattern: /^#\/kaarigar-profile$/, loader: () => import("../pages/kaarigar-profile.js") },
  { pattern: /^#\/admin$/, loader: unavailable, feature: "Admin & Verification" }
];

let currentPage = null;
let currentContainer = null;

export class Router {
  constructor(container) {
    this.container = container;
    this.navigationId = 0;
    currentContainer = container;
    window.addEventListener("hashchange", () => this.handleRoute());
  }

  start() {
    this.handleRoute();
  }

  async handleRoute() {
    const navigationId = ++this.navigationId;
    const hash = window.location.hash || "#/";

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
      const page = module.default || module;
      await new Promise(resolve => setTimeout(resolve, 100));
      if (navigationId !== this.navigationId) return;
      currentPage = page;

      const ctx = {
        params,
        store,
        feature: matchedRoute.feature,
        t
      };

      this.container.innerHTML = "";
      await page.mount(this.container, ctx);
      if (navigationId !== this.navigationId) return;
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

    } catch (err) {
      if (navigationId !== this.navigationId) return;
      console.error("Route load error:", err);
      this.container.innerHTML = `
        <div class="container" style="text-align:center; padding: 60px 20px;">
          <h2>Error loading page</h2>
          <p style="color:var(--text-muted); margin: 10px 0 20px;">${store.get("lang") === "hi" ? "यह पृष्ठ नहीं खुल सका। कृपया दोबारा कोशिश करें।" : "This page could not be opened. Please try again."}</p>
          <a href="#/" class="btn btn-primary">Go to Home</a>
        </div>
      `;
      this.container.classList.remove("fade-out");
      this.container.classList.add("fade-in");
    }
  }
}
