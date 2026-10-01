/* NIRMAAN 404 Not Found Page */
import { renderBottomNav } from "../components/bottom-nav.js";
import { store } from "../core/store.js";

export default {
  route: "#/404",
  title: "Page Not Found · Nirmaan",

  async mount(container, ctx) {
    const role = store.get("role") || "user";
    renderBottomNav();

    container.innerHTML = `
      <div class="container" style="min-height: 70vh; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px 20px;">
        
        <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(232, 98, 26, 0.12); display: flex; align-items: center; justify-content: center; font-size: 2.5rem; margin-bottom: 20px;">
          🧭
        </div>

        <span class="badge badge-saffron" style="margin-bottom: 12px;">Error 404</span>
        <h1 style="font-size: 1.8rem; font-weight: 800; color: var(--text-main); margin-bottom: 8px;">
          पेज नहीं मिला (Page Not Found)
        </h1>
        
        <p style="font-size: 0.92rem; color: var(--text-muted); max-width: 440px; margin-bottom: 28px; line-height: 1.5;">
          The page or route you followed might be broken, expired, or temporarily unavailable under construction.
        </p>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: center;">
          <a href="${role === "kaarigar" ? "#/kaarigar-home" : "#/user-home"}" class="btn btn-primary" style="font-weight: 700; padding: 12px 24px;">
            ← Return to Dashboard
          </a>
          <a href="#/projects" class="btn btn-secondary" style="font-weight: 700; padding: 12px 20px;">
            🧱 Projects Centre
          </a>
        </div>

      </div>
    `;
  },

  unmount() {}
};
